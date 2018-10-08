import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';
import Facade from './VirgilApi';
import { virgil } from '../lib/virgil';

export type AuthHandler = (client: Facade | null) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    user: firebase.User | null = null;
    client?: Facade;

    private _onAuthChange: AuthHandler | null = null;
    private static _instance: UserApi | null = null;

    static get instance(): UserApi {
        if (UserApi._instance) return UserApi._instance;
        return (UserApi._instance = new UserApi());
    }

    constructor() {
        firebase.auth().onAuthStateChanged(async user => {
            this.user = user;
            if (user) {
                const client = await this.createVirgilClient(user);
                if (this._onAuthChange) this._onAuthChange(client);
            } else {
                if (this._onAuthChange) this._onAuthChange(null);
            }
        });
    }

    subscribeOnAuthChange(cb: AuthHandler | null) {
        this._onAuthChange = cb;
    }

    async signUp(username: string, password: string) {
        username = username.toLocaleLowerCase();
        let user: firebase.auth.UserCredential;
        try {
            user = await firebase
                .auth()
                .createUserWithEmailAndPassword(username + this.postfix, password);
        } catch (e) {
            throw e;
        }
        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: [],
        });

        virgil.client.signUp();
        return user;
    }

    async signIn(username: string, password: string) {
        return await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password)
            .then(() => virgil.client.signIn());
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

    private createVirgilClient = (user: firebase.User) => {
        if (!user) throw new Error('No user');
        const username = user.email!.replace('@virgilfirebase.com', '');
        this.client = virgil.bootstrap(username, this.getJwt);
        return this.client;
    };
}

export default UserApi;
