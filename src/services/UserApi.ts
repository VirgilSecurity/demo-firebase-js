import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';
import VirgilE2ee from '../lib/VirgilE2ee';

export type AuthHandler = (client: VirgilE2ee | null) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    user: firebase.User | null = null;
    virgilE2ee?: VirgilE2ee;

    private static _instance: UserApi | null = null;

    static get instance(): UserApi {
        if (UserApi._instance) return UserApi._instance;
        return (UserApi._instance = new UserApi());
    }

    async signUp(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();
        let user: firebase.auth.UserCredential;
        try {
            user = await firebase
                .auth()
                .createUserWithEmailAndPassword(username + this.postfix, password);

            this.user = user.user!;
        } catch (e) {
            throw e;
        }

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: [],
        });
        if (!this.virgilE2ee) this.virgilE2ee = this.createVirgilClient(username);
        return await this.virgilE2ee.bootstrap(brainkeyPassword);
    }

    async signIn(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();
        const user = await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password)
        this.user = user.user!;
        if (!this.virgilE2ee) this.virgilE2ee = this.createVirgilClient(username);
        return await this.virgilE2ee.bootstrap(brainkeyPassword);
    }

    getJwt = async (identity: string) => {
        if (!this.user) throw new Error('user must be logged');
        const token = await this.user.getIdToken();
        let response;
        try {
            response = await fetch(
                'https:///us-central1-js-chat-ff5ca.cloudfunctions.net/api/generate_jwt',
                {
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }),
                    method: 'POST',
                    body: JSON.stringify({ identity }),
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

    private createVirgilClient = (username: string) => {
        return new VirgilE2ee(username, this.getJwt);
    };
}

export default UserApi;
