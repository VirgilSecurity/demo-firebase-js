import { FirebaseCollections } from './FIrebaseCollections';
import firebase from 'firebase';

class ChannelsApi {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Channels);

    getChannels(user: string) {
        return this.collectionRef
            .where('members', 'array-contains', user)
            .get()
            .then(querySnapshot => querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }

    async createChannel(receiver: string, username: string) {
        const userRef = firebase.firestore().collection(FirebaseCollections.Users).doc(receiver)
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error('User doesn\'t exist');

        this.collectionRef.add({
            count: 0,
            members: [username, receiver]
        });
    }
}

export default new ChannelsApi();
