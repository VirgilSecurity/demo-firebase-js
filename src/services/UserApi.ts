import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';

export type UserInfo = { user: firebase.User; token: string; username: string } | null;
export type AuthHandler = (user: UserInfo) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    userInfo: UserInfo = null;
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);

    private _onAuthChange: AuthHandler | null = null;

    constructor() {
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                const result = await this.handleAuthStateChange(user);
                if (this._onAuthChange) this._onAuthChange(result);
                this.userInfo = result;
                return;
            }
            if (this._onAuthChange) this._onAuthChange(null);
            this.userInfo = null;
        });
    }

    subscribeOnAuthChange(cb: AuthHandler | null) {
        this._onAuthChange = cb;
    }

    async signUp(username: string, password: string) {
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

    private handleAuthStateChange = async (user: firebase.User) => {
        const username = user.email!.replace('@virgilfirebase.com', '');
        const token = await user.getIdToken();
        return { user: user, token: token, username: username };
    };
}

export default new UserApi();
