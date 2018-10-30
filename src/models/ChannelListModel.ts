import { FirebaseCollections } from './helpers/FirebaseCollections';
import firebase from 'firebase';
import ChannelModel, { IChannel } from './ChannelModel';
import { EThree } from '@virgilsecurity/e3kit';

export default class ChannelListModel {
    static channelCollectionRef = firebase.firestore().collection(FirebaseCollections.Channels);
    static userCollectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    channels: ChannelModel[] = [];

    constructor(private senderUsername: string, private virgilE2ee: EThree) {}

    getChannel(channelId: string) {
        const channel = this.channels.find(e => e.id === channelId);
        if (!channel) throw Error('Channel not found');
        return channel;
    }

    listenUpdates(senderUsername: string, cb: (channels: ChannelModel[]) => void) {
        return ChannelListModel.userCollectionRef.doc(senderUsername).onSnapshot(async snapshot => {
            const channelIds = snapshot.data()!.channels as string[];

            const channelsRefs = await Promise.all(
                channelIds.map((id: string) => ChannelListModel.channelCollectionRef.doc(id).get()),
            );

            const channels = channelsRefs.map(this.getChannelFromSnapshot);
            this.channels = channels.map(channel => new ChannelModel(channel, senderUsername, this.virgilE2ee));
            cb(this.channels);
        });
    }

    async createChannel(receiverUsername: string) {
        // We are using email auth provider, so all nicknames are lowercased by firebase
        receiverUsername = receiverUsername.toLowerCase();
        if (receiverUsername === this.senderUsername) {
            throw new Error('Autocommunication is not supported yet');
        }
        const hasChat = this.channels.some(e => e.receiver.username === receiverUsername);
        if (hasChat) throw new Error('You already has this channel');

        const receiverRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(receiverUsername);

        const senderRef = firebase
            .firestore()
            .collection(FirebaseCollections.Users)
            .doc(this.senderUsername);

        const [receiverDoc, senderDoc] = await Promise.all([receiverRef.get(), senderRef.get()]);
        if (!receiverDoc.exists) throw new Error("User doesn't exist");
        const channel = await ChannelListModel.channelCollectionRef.add({
            count: 0,
            members: [
                { username: this.senderUsername, uid: senderDoc.data()!.uid },
                { username: receiverUsername, uid: receiverDoc.data()!.uid },
            ],
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

    private getChannelFromSnapshot(snapshot: firebase.firestore.DocumentSnapshot): IChannel {
        return {
            ...(snapshot.data() as IChannel),
            id: snapshot.id,
        } as IChannel;
    }
}
