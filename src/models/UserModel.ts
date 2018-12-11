import firebase from 'firebase';
import { EThree } from '@virgilsecurity/e3kit';
import { FirebaseCollections } from './helpers/FirebaseCollections';
import AppStore from './AppState';
import ChatModel from './ChatModel';

export type AuthHandler = (client: EThree | null) => void;

const FIREBASE_FUNCTION_URL = 'https://YOUR_FIREBASE_ENDPOINT.cloudfunctions.net/api';
const ENDPOINT = `${FIREBASE_FUNCTION_URL}/virgil-jwt`;

async function fetchToken(authToken: string) {
    const response = await fetch(
    ENDPOINT,
    {
        headers: new Headers({
            'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
        })
    },
    );
    if (!response.ok) {
        throw `Error code: ${response.status} \nMessage: ${response.statusText}`;
    }
    return response.json().then(data => data.token);
};


class UserApi {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    eThree: Promise<EThree>;

    constructor(public state: AppStore) {
        this.eThree = new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    const getToken = () => user.getIdToken().then(fetchToken);

                    this.eThree = EThree.initialize(getToken);

                    this.eThree.then(resolve).catch(reject);
                        this.eThree.then(eThree => this.createChatModel(user.email!, eThree));
                } else {
                    this.state.setState(state.defaultState);
                    this.eThree.then(eThree => eThree.cleanup());                    
                }
            });
        });
    }

    async signUp(email: string, password: string, brainkeyPassword: string) {
        email = email.toLocaleLowerCase();

        const userInfo = await firebase.auth().createUserWithEmailAndPassword(email, password);

        await this.collectionRef.doc(email).set({
            createdAt: new Date(),
            uid: userInfo.user!.uid,
            channels: [],
        });
        const eThree = await this.eThree;
        await eThree.register();
        await eThree.backupPrivateKey(brainkeyPassword);
    }

    async signIn(email: string, password: string, brainkeyPassword: string) {
        email = email.toLocaleLowerCase();

        await firebase.auth().signInWithEmailAndPassword(email, password);

        const eThree = await this.eThree;
        const hasPrivateKey = await eThree.hasLocalPrivateKey();
        if (!hasPrivateKey) await eThree.restorePrivateKey(brainkeyPassword);
    }

    private async createChatModel(email: string, eThree: EThree) {
        const chatModel = new ChatModel(this.state, email, eThree);
        this.state.setState({ chatModel, email });
    }
}

export default UserApi;
