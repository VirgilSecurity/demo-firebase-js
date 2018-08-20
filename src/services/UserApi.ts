import firebase from 'firebase';
import VirgilApi from './VirgilApi';
import { FirebaseCollections } from './FIrebaseCollections';

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
        const userCredentials = await firebase
            .auth()
            .createUserWithEmailAndPassword(username + this.postfix, password);

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: []
        })
        const token = await userCredentials.user!.getIdToken();
        await this.checkOrCreateCard(username, token, password);
    }

    async signIn(username: string, password: string) {
        const userCredentials = await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password);
        const token = await userCredentials.user!.getIdToken();
        await this.checkOrCreateCard(username, token, password);
    }

    private handleAuthStateChange = async (user: firebase.User) => {
        const username = user.email!.replace('@virgilfirebase.com', '');
        const token = await user.getIdToken();
        return { user: user, token: token, username: username };
    };

    private async checkOrCreateCard(username: string, token: string, password: string) {
        const sdk = new VirgilApi(username, token);
        const isCardCreated = await sdk.isCardCreated();
        if (!isCardCreated) await sdk.createCard(password);
    }
}

export default new UserApi();
