import firebase from 'firebase';
import { EThree } from '@virgilsecurity/e3kit';
import { FirebaseCollections } from './helpers/FirebaseCollections';
import AppStore from './AppState';
import ChatModel from './ChatModel';

export type AuthHandler = (client: EThree | null) => void;

const getTokenFromFetchResponse = (res: Response) => {
    return res.ok
        ? res.json().then((data: { token: string }) => data.token)
        : Promise.reject(new Error('Error in getJWT with code: ' + res.status));
}

const fetchToken = (token: string) => fetch(
    'https://YOUR_FIREBASE_ENDPOINT.cloudfunctions.net/api/generate_jwt',
    {
        headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        })
    },
).then(getTokenFromFetchResponse);

class UserApi {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    eThree: Promise<EThree>;
    isManualLogin: boolean = false;

    constructor(public state: AppStore) {
        this.eThree = new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    const getToken = () => user.getIdToken().then(fetchToken);

                    this.eThree = EThree.init(getToken);

                    this.eThree.then(resolve).catch(reject);
                    
                    if (!this.isManualLogin) {
                        this.eThree.then(eThree => this.createChatModel(user.email!, eThree));
                        this.isManualLogin = false;
                    }
                } else {
                    this.eThree.then(sdk => sdk.cleanup());
                    this.state.setState(state.defaultState);
                }
            });
        });
    }

    async signUp(username: string, password: string, brainkeyPassword: string) {
        this.isManualLogin = true;
        username = username.toLocaleLowerCase();
        let userInfo: firebase.auth.UserCredential;
        this.isManualLogin = true;
        try {
            userInfo = await firebase.auth().createUserWithEmailAndPassword(username, password);

            this.state.setState({ username: username });
        } catch (e) {
            throw e;
        }

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            uid: userInfo.user!.uid,
            channels: [],
        });
        const eThree = await this.eThree;
        return await eThree
            .bootstrap(brainkeyPassword)
            .then(() => this.createChatModel(username, eThree));
    }

    async signIn(username: string, password: string, brainkeyPassword: string) {
        this.isManualLogin = true;
        username = username.toLocaleLowerCase();

        await firebase.auth().signInWithEmailAndPassword(username, password);

        this.state.setState({ username: username });

        const eThree = await this.eThree;
        await eThree.bootstrap(brainkeyPassword).then(() => this.createChatModel(username, eThree));
    }

    async createChatModel(username: string, eThree: EThree) {
        const chatModel = new ChatModel(this.state, username, eThree);
        this.state.setState({ chatModel });
    }
}

export default UserApi;
