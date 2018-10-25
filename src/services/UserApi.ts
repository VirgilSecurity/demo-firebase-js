import firebase from 'firebase';
import { FirebaseCollections } from './FirebaseCollections';
import { EThree } from '@virgilsecurity/e3kit';
import AppStore from '../models/AppState';
import ChatModel from '../models/ChatModel';

export type AuthHandler = (client: EThree | null) => void;

class UserApi {
    postfix = '@virgilfirebase.com';
    collectionRef = firebase.firestore().collection(FirebaseCollections.Users);
    eThree: Promise<EThree>;

    constructor(public state: AppStore) {
        this.eThree = new Promise((resolve, reject) => {
            return firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    const eThreePromise = EThree.init(this.getJwt(user));
                    
                    eThreePromise
                        .then(resolve)
                        .catch(reject)

                    eThreePromise.then((eThree) => {
                        this.createChatModel(user.email!.replace('@virgilfirebase.com', ''), eThree);
                    });
                } else {
                    this.state.setState(state.defaultState);
                }
            })
        });
    }

    getJwt = (user: firebase.User) => async () => {
        const token = await user.getIdToken()
        let response = await fetch(
            'https:///us-central1-js-chat-ff5ca.cloudfunctions.net/api/generate_jwt',
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

    async signUp(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();

        try {
            await firebase
                .auth()
                .createUserWithEmailAndPassword(username + this.postfix, password)

            this.state.setState({ username: username })
        } catch (e) {
            throw e;
        }

        this.collectionRef.doc(username).set({
            createdAt: new Date(),
            channels: [],
        });
        const eThree = await this.eThree;
        await eThree.bootstrap(brainkeyPassword);
    }

    async signIn(username: string, password: string, brainkeyPassword: string) {
        username = username.toLocaleLowerCase();
        await firebase.auth().signInWithEmailAndPassword(username + this.postfix, password);

        this.state.setState({ username: username });

        const eThree = await this.eThree;
        await eThree.bootstrap(brainkeyPassword);
    }

    async createChatModel(username: string, eThree: EThree) {
        const chatModel = new ChatModel(this.state, username, eThree);
        this.state.setState({ chatModel });
    }
}

export default UserApi;
