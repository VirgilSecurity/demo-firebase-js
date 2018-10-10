import { VirgilPublicKey } from "virgil-crypto";
import VirgilToolbox from "./virgilToolbox";

export class VirgilReceiver {
    private _publicKeys?: Promise<VirgilPublicKey[]>;

    constructor(public username: string, readonly toolbox: VirgilToolbox) {}

    get publicKeys(): Promise<VirgilPublicKey[]> {
        if (this._publicKeys) return this._publicKeys;
        return this.toolbox.getPublicKeys(this.username);
    }

    preloadKeys() {
        this._publicKeys = this.toolbox.getPublicKeys(this.username);
    }
}
