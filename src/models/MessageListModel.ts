import { FirebaseCollections } from './helpers/FirebaseCollections';
import ChannelListModel from './ChannelListModel';
import firebase from 'firebase';
import ChannelModel, { ChannelUser } from './ChannelModel';

export interface IMessage {
    id: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
}

export default class MessagesListModel {
    constructor(public channel: ChannelModel) {}

    async sendMessage(message: string) {
        firebase.firestore().runTransaction(transaction => {
            return this.updateMessage(transaction, message);
        });
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return ChannelListModel.channelCollectionRef
            .doc(id)
            .collection(FirebaseCollections.Messages)
            .orderBy('createdAt', 'asc')
            .onSnapshot(async snapshot => {
                const loadedMessages = snapshot
                    .docChanges()
                    .filter(messageSnapshot => messageSnapshot.type === 'added')
                    .map(e => this.getMessageFromSnapshot(e.doc));

                await this.blindNewMessages(loadedMessages);
                cb(loadedMessages);
            });
    }

    private getMessageFromSnapshot(snapshot: firebase.firestore.QueryDocumentSnapshot): IMessage {
        return {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt.toDate(),
        } as IMessage;
    }

    private updateMessage = async (
        transaction: firebase.firestore.Transaction,
        message: string,
    ) => {
        const channelRef = ChannelListModel.channelCollectionRef.doc(this.channel.id);
        const snapshot = await transaction.get(channelRef);
        let messagesCount: number = snapshot.data()!.count;
        const messagesCollectionRef = channelRef
            .collection(FirebaseCollections.Messages)
            .doc(messagesCount.toString());

        if (snapshot.exists) {
            transaction.update(channelRef, { count: ++messagesCount });
            transaction.set(messagesCollectionRef, {
                body: message,
                createdAt: new Date(),
                sender: this.channel.sender.username,
                receiver: this.channel.receiver.username,
            });
        }

        return transaction;
    };

    private async blindNewMessages(loadedMessages: IMessage[]) {
        // Messages are deleted after receiver read it, so we can't encrypt them
        const newMessages = loadedMessages.filter(m => m.body !== '');
        // Here we deleting message content after receiver read it.
        // This is one of the HIPPA requirements.
        newMessages.forEach(this.blindMessage);

        return newMessages;
    }

    private blindMessage = async (message: IMessage) => {
        // if messages loaded by receiver do not blind body
        if (this.channel.receiver.username === message.receiver) return;
        return ChannelListModel.channelCollectionRef
            .doc(this.channel.id)
            .collection(FirebaseCollections.Messages)
            .doc(message.id)
            .update({
                ...message,
                body: '',
            });
    };
}
