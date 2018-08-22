import { FirebaseCollections } from '../services/FirebaseCollections';
import { IMessage } from '../components/Messages';
import ChannelListModel from './ChannelListModel';
import firebase from 'firebase';
import ChannelModel, { IChannel } from './ChannelModel';
import UserApi from '../services/UserApi';
import VirgilApi from '../services/VirgilApi';
import MessageStorage from './MessageStorage';
import { VirgilPublicKey } from 'virgil-crypto';

export default class MessagesListModel {
    VirgilApi: VirgilApi;
    storage: MessageStorage;
    receiverPublicKeys: Promise<VirgilPublicKey[]>;

    constructor(public channel: ChannelModel, public sender: string) {
        this.storage = new MessageStorage(channel.id);
        if (!UserApi.instance.userInfo) throw Error('set user first');
        this.VirgilApi = new VirgilApi(sender, UserApi.instance.userInfo.token);
        this.receiverPublicKeys = this.getReceiverPublicKeys();
    }

    async getMessages(loadedMessages: IMessage[]) {
        // Messages are deleted after receiver read it, so we can't encrypt them;
        const { encryptedMessages, deletedMessages } = this.getEncryptedAndDeletedMessages(
            loadedMessages,
        );

        const decryptedMessages = await this.decryptMessages(encryptedMessages);
        decryptedMessages.map(this.blindMessage);

        const messagesFromStorage = this.storage.addMessages([
            ...deletedMessages,
            ...decryptedMessages,
        ]);

        return messagesFromStorage;
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.VirgilApi.encrypt(
            message,
            await this.receiverPublicKeys,
        );

        firebase.firestore().runTransaction(transaction => {
            return this.updateMessage(transaction, this.channel, encryptedMessage, this.sender);
        });
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return ChannelListModel.collectionRef
            .doc(id)
            .collection(FirebaseCollections.Messages)
            .orderBy('createdAt', 'asc')
            .onSnapshot(async snapshot => {
                const loadedMessages = snapshot
                    .docChanges()
                    .filter(messageSnapshot => messageSnapshot.type === 'added')
                    .map(e => this.getMessageFromSnapshot(e.doc));

                const messages = await this.getMessages(loadedMessages);
                cb(messages);
            });
    }

    private getMessageFromSnapshot(snapshot: firebase.firestore.QueryDocumentSnapshot): IMessage {
        return {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt.toDate(),
        } as IMessage;
    }

    private decryptMessages = async (encryptedMessages: IMessage[]) => {
        const decryptedBodies = await Promise.all(
            encryptedMessages.map(m => this.VirgilApi.decrypt(m.body)),
        );
        const decryptedMessages = encryptedMessages.map((m, i) => {
            m.body = decryptedBodies[i];
            return m;
        });

        return decryptedMessages;
    };

    private blindMessage = async (message: IMessage) => {
        // if messages loaded by receiver do not blind body
        if (this.channel.receiver === message.receiver) return;
        return ChannelListModel.collectionRef
            .doc(this.channel.id)
            .collection(FirebaseCollections.Messages)
            .doc(message.id)
            .update({
                ...message,
                body: '',
            });
    };

    private updateMessage = async (
        transaction: firebase.firestore.Transaction,
        channel: IChannel,
        message: string,
        username: string,
    ) => {
        const channelRef = ChannelListModel.collectionRef.doc(channel.id);
        const snapshot = await transaction.get(channelRef);
        const messagesCount: number = snapshot.data()!.count + 1;
        const messagesCollectionRef = channelRef
            .collection(FirebaseCollections.Messages)
            .doc(messagesCount.toString());

        if (snapshot.exists) {
            transaction.update(channelRef, { count: messagesCount });
            transaction.set(messagesCollectionRef, {
                body: message,
                createdAt: new Date(),
                sender: username,
                receiver: channel.members.filter(e => e !== username)[0],
            });
        }

        return transaction;
    };

    private getReceiverPublicKeys() {
        return this.VirgilApi.getPublicKeys(this.channel.receiver);
    }

    private getEncryptedAndDeletedMessages(
        loadedMessages: IMessage[],
    ): { encryptedMessages: IMessage[]; deletedMessages: IMessage[] } {
        return loadedMessages.reduce(
            (storage, e) => {
                e.body !== '' ? storage.encryptedMessages.push(e) : storage.deletedMessages.push(e);
                return storage;
            },
            {
                encryptedMessages: [] as IMessage[],
                deletedMessages: [] as IMessage[],
            },
        );
    }
}
