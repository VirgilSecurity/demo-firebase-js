import firebase from '../../node_modules/firebase';

class Channels {
    getChannels(user: string) {
        return firebase
            .firestore()
            .collection('Channels')
            .where('members', 'array-contains', user)
            .get()
            .then(querySnapshot => {
                const stor: firebase.firestore.DocumentData[] = [];
                const snap = querySnapshot.forEach(doc => {
                    stor.push({ ...doc.data(), id: doc.id })
                });

                return stor;
            });
    }
}

export const channels = new Channels();
