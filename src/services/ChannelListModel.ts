import { FirebaseCollections } from './FirebaseCollections';
import firebase from 'firebase';
import { IMessage } from '../components/Messages';
import ChannelModel, { IChannel } from './ChannelModel';

export default class ChannelListModel {
    static collectionRef = firebase.firestore().collection(FirebaseCollections.Channels);
    channels: ChannelModel[] = [];
    messages: IMessage[] = [];

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
                return snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const channel = this.getChannelFromSnapshot(change.doc);
                        this.channels.push(new ChannelModel(channel, this.username));
                    }
                });
            })
    }

    async createChannel(receiver: string, username: string) {
        const userRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(receiver);
    
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User doesn't exist");

        const channel = await ChannelListModel.collectionRef.add({
            count: 0,
            members: [username, receiver],
        });

        userRef.update({
            channels: userDoc.data()!.channels.push(channel.id)
        })
    }

    private getChannelFromSnapshot(snapshot: firebase.firestore.QueryDocumentSnapshot): IChannel {
        return {
            ...snapshot.data() as IChannel,
            id: snapshot.id,
        } as IChannel;
    }
}
