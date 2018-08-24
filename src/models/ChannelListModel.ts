import { FirebaseCollections } from '../services/FirebaseCollections';
import firebase from 'firebase';
import ChannelModel, { IChannel } from './ChannelModel';
import VirgilApi from '../services/VirgilApi';

export default class ChannelListModel {
    static collectionRef = firebase.firestore().collection(FirebaseCollections.Channels);
    channels: ChannelModel[] = [];

    constructor(public username: string, public virgilApi: VirgilApi) {}

    getChannel(channelId: string) {
        const channel = this.channels.find(e => e.id === channelId);
        if (!channel) throw Error('Channel not found');
        return channel;
    }

    listenUpdates(username: string, cb: (channels: IChannel[]) => void) {
        return ChannelListModel.collectionRef
            .where('members', 'array-contains', username)
            .onSnapshot(snapshot => {
                const channels = snapshot.docs.map(this.getChannelFromSnapshot);
                cb(channels);
                return snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const channel = this.getChannelFromSnapshot(change.doc);
                        this.channels.push(new ChannelModel(channel, this.username, this.virgilApi));
                    }
                });
            });
    }

    async createChannel(receiver: string, username: string) {
        if (receiver === username) throw new Error('Autocommunication is not supported yet');
        const hasChat = this.channels.some(e => e.receiver === receiver);
        if (hasChat) throw new Error('You already has this channel');

        const receiverRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(receiver);

        const senderRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(username);

        const [receiverDoc, senderDoc] = await Promise.all([receiverRef.get(), senderRef.get()]);
        if (!receiverDoc.exists) throw new Error("User doesn't exist");

        const channel = await ChannelListModel.collectionRef.add({
            count: 0,
            members: [username, receiver],
        });

        firebase.firestore().runTransaction(async transaction => {
            const senderChannels = senderDoc.data()!.channels;
            const receiverChannels = receiverDoc.data()!.channels;

            transaction.update(receiverRef, {
                channels: senderChannels ? senderChannels.concat(channel.id) : [channel.id],
            });

            transaction.update(senderRef, {
                channels: receiverChannels ? receiverChannels.concat(channel.id) : [channel.id],
            });

            return transaction;
        });
    }

    private getChannelFromSnapshot(snapshot: firebase.firestore.QueryDocumentSnapshot): IChannel {
        return {
            ...(snapshot.data() as IChannel),
            id: snapshot.id,
        } as IChannel;
    }
}
