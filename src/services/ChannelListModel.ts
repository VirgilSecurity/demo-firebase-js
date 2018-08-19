import { IChannel } from './ChannelListModel';
import { FirebaseCollections } from './FIrebaseCollections';
import firebase from 'firebase';

export interface IChannel {
    id: string;
    count: number;
    members: string[];
}

export default class ChannelListModel {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Channels);

    getChannels(user: string): Promise<IChannel[]> {
        return this.collectionRef
            .where('members', 'array-contains', user)
            .get()
            .then(this.getChannelsFromSnapshot);
    }

    listenUpdates(username: string, cb: (error: Error | null, channels: IChannel[]) => void) {
        return this.collectionRef
            .where('members', 'array-contains', username)
            .onSnapshot(snapshot => {
                const channels = this.getChannelsFromSnapshot(snapshot);
                cb(null, channels);
            });
    }

    async createChannel(receiver: string, username: string) {
        const userRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(receiver);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User doesn't exist");

        this.collectionRef.add({
            count: 0,
            members: [username, receiver],
        });
    }

    getReceiverUsername(sender: string, channel: IChannel) {
        const receiver = channel.members.filter(e => e !== sender)[0];
        if (!receiver) throw new Error('receiver');
        return receiver;
    }

    private getChannelsFromSnapshot(snapshot: firebase.firestore.QuerySnapshot): IChannel[] {
        return snapshot.docs.map(d => ({
            ...d.data() as IChannel,
            id: d.id,
        })) as IChannel[];
    }
}
