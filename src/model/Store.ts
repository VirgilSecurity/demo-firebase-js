import { inject } from 'mobx-react';
import { observable, computed, action } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import firebase from 'firebase';

export class Model {
    constructor(protected store: Store) {}
}

export class UserStore extends Model {
    @observable email: string | null = null;
    @observable isLogged: boolean;
    @observable error: string;

    @computed
    get userRef() {
        return this.store.db.collection('users').doc(this.email);
    }

    @action.bound
    async signIn(id: string, password: string) {
        let user;
        try {
            user = await firebase.auth().signInWithEmailAndPassword(id, password);
        } catch (e) {
            this.error = e.message;
        }

        this.email = user.user!.email!;
        this.isLogged = true;
        this.store.router.push(Routes.index);
    }

    @action.bound
    async signOut() {
        firebase.auth().signOut();
        this.email = null;
        this.isLogged = false;
        this.store.router.push(Routes.signIn);
    }
}

export class ChannelsStore extends Model {
    collectionRef = this.store.db.collection('channels');

    constructor(protected store: Store) {
        super(store);
    }

    loadChannels = () => {
        this.store.user.userRef.get().then();
    };
}

export function injectStore() {
    return inject(all => all);
}

export interface IWithStore {
    store?: Store;
}

export default class Store {
    db = firebase.firestore();
    user = new UserStore(this);
    channels = new ChannelsStore(this);
    router = new RouterStore();
}
