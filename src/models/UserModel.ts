import firebase from 'firebase';
import { EThree } from '@virgilsecurity/e3kit-browser';
import { FirebaseCollections } from './helpers/FirebaseCollections';
import AppStore from './AppState';
import ChatModel from './ChatModel';

export type AuthHandler = (client: EThree | null) => void;

class UserApi {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    eThree: Promise<EThree>;

    constructor(public state: AppStore) {
        // here we will keep link to promise with initialized e3kit library
        this.eThree = new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(async user => {
                if (user) {
                    const getVirgilJwt = firebase.functions().httpsCallable('getVirgilJwt');
                    const initializeFunction = () => getVirgilJwt().then(result => result.data.token);
                    // callback onAuthStateChanged can be called with second user, so we make new
                    // reference to e3kit
                    this.eThree = EThree.initialize(initializeFunction);
                    this.eThree.then(resolve).catch(reject);
                    const eThree = await this.eThree;
                    // if user has private key locally, then he didn't logout
                    if (await eThree.hasLocalPrivateKey()) this.openChatWindow(user.email!, eThree)
                } else {
                    this.state.setState(state.defaultState);
                    // cleanup private key on logout
                    this.eThree.then(eThree => eThree.cleanup());
                }
            });
        });
    }

    async signUp(email: string, password: string, brainkeyPassword: string) {
        email = email.toLocaleLowerCase();

        const userInfo = await firebase.auth().createUserWithEmailAndPassword(email, password);

        const eThree = await this.eThree;

        try {
            await eThree.register();
            await eThree.backupPrivateKey(brainkeyPassword);
            await this.collectionRef.doc(email).set({
                createdAt: new Date(),
                uid: userInfo.user!.uid,
                channels: [],
            });
            this.openChatWindow(email, eThree);
        } catch (error) {
            await userInfo.user!.delete();
            console.error(error);
            throw error;
        }
    }

    async signIn(email: string, password: string, brainkeyPassword: string) {
        email = email.toLocaleLowerCase();

        await firebase.auth().signInWithEmailAndPassword(email, password);
        const eThree = await this.eThree;
        const hasPrivateKey = await eThree.hasLocalPrivateKey();
        try {
        if (!hasPrivateKey) await eThree.restorePrivateKey(brainkeyPassword);
            this.openChatWindow(email, eThree);
        } catch (e) {
            firebase.auth().signOut();
            throw e;
        }
    }

    async openChatWindow(email: string, eThree: EThree) {
        const chatModel = new ChatModel(this.state, email, eThree);
        this.state.setState({ chatModel, email });
    }
}

export default UserApi;
