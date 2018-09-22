import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';
import VirgilApi from './VirgilApi';

export type UserParams = { username: string, virgilApi: VirgilApi } | null;
export type AuthHandler = (params: UserParams) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    params: UserParams = null;
    
    private _onAuthChange: AuthHandler | null = null;
    private static _instance: UserApi | null = null;

    static get instance(): UserApi {
        if (UserApi._instance) return UserApi._instance;
        return UserApi._instance = new UserApi();
    }

    constructor() {
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                const username = user.email!.replace('@virgilfirebase.com', '');
                const virgilApi = new VirgilApi(username, () => user.getIdToken())
                this.params = { username, virgilApi };
                if (this._onAuthChange) this._onAuthChange(this.params);
                return;
            }
            if (this._onAuthChange) this._onAuthChange(null);
            this.params = null;
        });
    }

    subscribeOnAuthChange(cb: AuthHandler | null) {
        this._onAuthChange = cb;
    }

    async signUp(username: string, password: string) {
        username = username.toLocaleLowerCase();
        await firebase
            .auth()
            .createUserWithEmailAndPassword(username + this.postfix, password);

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: []
        })
    }

    async signIn(username: string, password: string) {
        await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password);
    }
}

export default UserApi;
