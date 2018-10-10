import VirgilToolbox from "../virgilToolbox";
import { VirgilPrivateKey } from "virgil-crypto";

export default abstract class KeyLoader {
    constructor(public sdk: VirgilToolbox) {}

    abstract savePrivateKey(privateKey: VirgilPrivateKey): void;
    abstract loadPrivateKey(): Promise<VirgilPrivateKey | null>;
}

