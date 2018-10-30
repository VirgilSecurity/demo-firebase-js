import firebase from 'firebase';
import { EThree } from '@virgilsecurity/e3kit';
import { FirebaseCollections } from './helpers/FirebaseCollections';
import AppStore from './AppState';
import ChatModel from './ChatModel';

export type AuthHandler = (client: EThree | null) => void;

class UserApi {
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    eThree: Promise<EThree>;
    isManualLogin: boolean = false;

    constructor(public state: AppStore) {
        this.eThree = new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    const getToken = async () => {
                        const token = await user.getIdToken();

                        let response = await fetch(
                            'https://YOUR_FIREBASE_ENDPOINT.cloudfunctions.net/api/generate_jwt',
                            {
                                headers: new Headers({
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                }),
                                method: 'POST',
                            },
                        );
                        if (response.ok) {
                            const data = (await response.json()) as { token: string };
                            return data.token;
                        }
                        throw new Error('Error in getJWT with code: ' + response.status);
                    };

                    const eThreePromise = EThree.init(getToken);

                    eThreePromise.then(resolve).catch(reject);
                    if (!this.isManualLogin) {
                        eThreePromise.then(eThree => this.createChatModel(user.email!, eThree));
                        this.isManualLogin = false;
                    }

                    this.eThree = eThreePromise;
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
        await eThree
            .bootstrap(brainkeyPassword)
            .then(() => this.createChatModel(username, eThree));
    }

    async createChatModel(username: string, eThree: EThree) {
        const chatModel = new ChatModel(this.state, username, eThree);
        this.state.setState({ chatModel });
    }
}

export default UserApi;
