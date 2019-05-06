import MessageStorage from './MessageStorage';
import { EThree, LookupResult } from '@virgilsecurity/e3kit';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { FirebaseCollections } from './helpers/FirebaseCollections';
import { DecryptedMessage, EncryptedMessage } from './MessageModel';
import { IMessage } from './MessageListModel';

export interface IChannel {
    id: string;
    count: number;
    members: ChannelUser[];
}

export type ChannelUser = { username: string; uid: string };

export default class ChannelModel implements IChannel {
    public id: string;
    public count: number;
    public members: ChannelUser[];
    public publicKeys: Promise<LookupResult>;
    public currentMessage: DecryptedMessage;
    private channelStorageRef: firebase.storage.Reference;
    private messageStorage: MessageStorage;

    constructor(
        { id, count, members }: IChannel,
        public senderUsername: string,
        public virgilE2ee: EThree,
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
        this.messageStorage = new MessageStorage(this.id);
        this.channelStorageRef = firebase.storage().ref();

        this.publicKeys = virgilE2ee.lookupPublicKeys([this.receiver.uid, this.sender.uid]);

        this.currentMessage = new DecryptedMessage(
            { sender: this.sender.username, receiver: this.receiver.username },
            this,
        );
    }

    get receiver() {
        return this.members.filter(e => e.username !== this.senderUsername)[0];
    }

    get sender() {
        return this.members.filter(e => e.username === this.senderUsername)[0];
    }

    getMember(username: string) {
        const member = this.members.find(member => member.username === username);
        if (!member) throw new Error(member + ' is not in channel ' + this.id);
        return member;
    }

    uploadFile(filename: string, file: Blob) {
        return this.channelStorageRef.child(`${this.id}/${filename}`).put(file);
    }

    async sendMessage() {
        const encryptedMessage = await this.currentMessage.encrypt(this.virgilE2ee);

        firebase.firestore().runTransaction(async transaction => {
            await this.updateMessage(transaction, encryptedMessage);
            this.currentMessage = new DecryptedMessage(
                { sender: this.sender.username, receiver: this.receiver.username },
                this,
            );
        });
    }

    listenMessages(cb: (messages: DecryptedMessage[]) => void) {
        return ChannelListModel.channelCollectionRef
            .doc(this.id)
            .collection(FirebaseCollections.Messages)
            .orderBy('createdAt', 'asc')
            .onSnapshot(async snapshot => {
                const loadedMessages = snapshot
                    .docChanges()
                    .filter(messageSnapshot => messageSnapshot.type === 'added')
                    .map(e => EncryptedMessage.fromSnapshot(e.doc, this, this.virgilE2ee));
                const decryptedMessages = await Promise.all(loadedMessages.map(m => m.decrypt()));
                console.log('decryptedMessages', decryptedMessages);
                const messages = decryptedMessages.map(m => m.toJSON()) as IMessage[];
                console.log('messages', messages);

                const restoredMessages = this.messageStorage
                    .addMessages(messages)
                    .map(m => DecryptedMessage.fromJSON(m, this));
                console.log('restored messages', restoredMessages)
                cb(restoredMessages);
            });
    }

    private updateMessage = async (
        transaction: firebase.firestore.Transaction,
        message: EncryptedMessage,
    ) => {
        const channelRef = ChannelListModel.channelCollectionRef.doc(this.id);
        const snapshot = await transaction.get(channelRef);
        let messagesCount: number = snapshot.data()!.count;
        const messagesCollectionRef = channelRef
            .collection(FirebaseCollections.Messages)
            .doc(messagesCount.toString());

        if (snapshot.exists) {
            transaction.update(channelRef, { count: ++messagesCount });
            transaction.set(messagesCollectionRef, {
                body: message.body,
                createdAt: new Date(),
                sender: this.sender.username,
                receiver: this.receiver.username,
                attachment: message.attachment,
            });
        }

        return transaction;
    };
}
