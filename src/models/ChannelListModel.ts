import { FirebaseCollections } from '../services/FirebaseCollections';
import firebase from 'firebase';
import ChannelModel, { IChannel } from './ChannelModel';

export default class ChannelListModel {
    static collectionRef = firebase.firestore().collection(FirebaseCollections.Channels);
    channels: ChannelModel[] = [];

    constructor(public username: string) {}

    getChannel(channelId: string) {
        const channel = this.channels.find(e => e.id === channelId);
        if (!channel) throw Error('Channel not found');
        return channel;
    }

    async loadChannels(user: string): Promise<IChannel[]> {
        const channels = await ChannelListModel.collectionRef
            .where('members', 'array-contains', user)
            .get()
            .then(s => s.docs.map(this.getChannelFromSnapshot));

        this.channels = channels.map(c => new ChannelModel(c, user));
        return channels;
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
                        this.channels.push(new ChannelModel(channel, this.username));
                    }
                });
            });
    }

    async createChannel(receiver: string, username: string) {
        const receiverRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(receiver);

        const senderRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(username);

        // TODO make in transaction and optimise requests
        const receiverDoc = await receiverRef.get();
        if (!receiverDoc.exists) throw new Error("User doesn't exist");

        const channel = await ChannelListModel.collectionRef.add({
            count: 0,
            members: [username, receiver],
        });

        const senderChannels = receiverDoc.data()!.channels;
        const receiverChannels = receiverDoc.data()!.channels;

        receiverRef.update({
            channels: senderChannels ? senderChannels.concat(channel.id) : [channel.id],
        });

        senderRef.update({
            channels: receiverChannels ? receiverChannels.concat(channel.id) : [channel.id],
        });
    }

    private getChannelFromSnapshot(snapshot: firebase.firestore.QueryDocumentSnapshot): IChannel {
        return {
            ...(snapshot.data() as IChannel),
            id: snapshot.id,
        } as IChannel;
    }
}
