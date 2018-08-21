import { FirebaseCollections } from './FirebaseCollections';
import { IMessage } from '../components/Messages';
import ChannelListModel from './ChannelListModel';
import firebase from 'firebase';
import ChannelModel, { IChannel } from './ChannelModel';
import UserApi from './UserApi';
import VirgilApi from './VirgilApi';
import MessageStorage from '../models/MessageStorage';

export default class MessagesListModel {
    VirgilApi: VirgilApi;
    storage: MessageStorage;

    constructor(public channel: ChannelModel, public sender: string) {
        console.log('channel', channel, channel.id);
        this.storage = new MessageStorage(channel.id)
        if (!UserApi.userInfo) throw Error('set user first');
        this.VirgilApi = new VirgilApi(sender, UserApi.userInfo.token);
    }

    async loadMessages() {
        const snapshot = await ChannelListModel.collectionRef
            .doc(this.channel.id)
            .collection(FirebaseCollections.Messages)
            .orderBy('createdAt', 'asc')
            .get();

        const loadedMessages = snapshot.docs.map(this.getMessageFromSnapshot);
        const { encryptedMessages, deletedMessages } = loadedMessages.reduce(
            (storage, e) => {
                e.body !== '' ? storage.encryptedMessages.push(e) : storage.deletedMessages.push(e);
                return storage;
            },
            {
                encryptedMessages: [] as IMessage[],
                deletedMessages: [] as IMessage[],
            },
        );

        const decryptedMessages = await this.decryptMessages(encryptedMessages);
        console.log('decryptedMessages', decryptedMessages);
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
            this.sender,
            this.channel.receiver,
        );

        firebase.firestore().runTransaction(transaction => {
            return this.updateMessage(transaction, this.channel, encryptedMessage, this.sender);
        });
    }

    // listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
    //     return ChannelListModel.collectionRef
    //         .doc(id)
    //         .collection(FirebaseCollections.Messages)
    //         .orderBy('createdAt', 'asc')
    //         .onSnapshot(async snapshot => {
    //             let messages: IMessage[] = [];
    //             snapshot.docChanges().forEach(messageSnapshot => {
    //                 if (messageSnapshot.type === 'added') {
    //                     const encryptedMessage = this.getMessageFromSnapshot(messageSnapshot.doc);
    //                     messages.push(encryptedMessage);
    //                     if (encryptedMessage.body !== '') this.deleteBody(messageSnapshot.doc.id, encryptedMessage);
    //                 }
    //             });
    //             const decryptedMessages = await this.decryptMessages(messages);
    //             this.saveMessages(decryptedMessages);
    //             cb(decryptedMessages);
    //         });
    // }

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
}
