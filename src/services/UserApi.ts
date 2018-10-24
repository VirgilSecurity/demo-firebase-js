import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';
import { EThree } from '@virgilsecurity/e3kit';

export type AuthHandler = (client: EThree | null) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    user: firebase.User | null = null;
    virgilE2ee?: EThree;
    username?: string 

    private static _instance: UserApi | null = null;

    static get instance(): UserApi {
        if (UserApi._instance) return UserApi._instance;
        return (UserApi._instance = new UserApi());
    }

    getJwt = async () => {
        if (!this.user) throw new Error('user must be logged');
        const token = await firebase.auth().currentUser!.getIdToken();
        let response;
        try {
            response = await fetch(
                'https:///us-central1-js-chat-ff5ca.cloudfunctions.net/api/generate_jwt',
                {
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }),
                    method: 'POST'
                },
            );
        } catch (e) {
            throw new Error(e);
        }
        if (response.ok) {
            const data = (await response.json()) as { token: string };
            return data.token;
        }
        throw new Error('Error in getJWT with code: ' + response.status);
    };

    async signUp(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();
        let user: firebase.auth.UserCredential;
        try {
            user = await firebase
                .auth()
                .createUserWithEmailAndPassword(username + this.postfix, password);

            this.user = user.user!;
            this.username = username;
        } catch (e) {
            throw e;
        }

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: [],
        });
        if (!this.virgilE2ee) this.virgilE2ee = await EThree.init(this.getJwt);
        return this.virgilE2ee.bootstrap(brainkeyPassword);
    }

    async signIn(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();
        const user = await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password)
        this.user = user.user!;
        this.username = username;
        if (!this.virgilE2ee) this.virgilE2ee = await EThree.init(this.getJwt);
        return this.virgilE2ee.bootstrap(brainkeyPassword);
    }

}

export default UserApi;
