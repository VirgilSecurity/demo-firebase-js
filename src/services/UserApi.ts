import firebase from 'firebase';

class UserApi {
    postfix = '@virgilfirebase.com';

    async signUp(username: string, password: string) {
        return await firebase
            .auth()
            .createUserWithEmailAndPassword(username + this.postfix, password);
    }

    async signIn(username: string, password: string) {
        return await firebase
            .auth()
            .signInWithEmailAndPassword(username + this.postfix, password);
    }
}

export default new UserApi();
