import UserApi from "./UserApi";
import VirgilApi from './VirgilApi';

export class CoreApi {
    VirgilApi?: VirgilApi;

    async signUp(username: string, password: string) {
        const userCredentials = await UserApi.signUp(username, password);
        const token = await userCredentials.user!.getIdToken();
        if (!this.VirgilApi || username !== this.VirgilApi.identity) {
            this.VirgilApi = new VirgilApi(username, token);
        }
        await this.VirgilApi.createCard();
    }

    async signIn(username: string, password: string) {
        const userCredentials = await UserApi.signIn(username, password);
        const token = await userCredentials.user!.getIdToken();
        if (!this.VirgilApi || username !== this.VirgilApi.identity) {
            this.VirgilApi = new VirgilApi(username, token);
        }
    }
}

export default new CoreApi();