import { EThree } from '@virgilsecurity/e3kit';
import ChannelModel from './ChannelModel';
import firebase from 'firebase';

export interface IMessage {
    id: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
    attachment?: string;
}

export interface IDecryptedMessageProps {
    id?: string;
    body?: string;
    createdAt?: Date;
    receiver: string;
    sender: string;
    attachment?: string;
}

export interface IEncryptedMessageProps {
    id?: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
    attachment?: string;
}

export interface IMessageData {
    body: string;
    sender: string;
    receiver: string;
    createdAt: firebase.firestore.Timestamp;
    attachment?: string;
}

export class DecryptedMessage {
    id?: string;
    body?: string;
    createdAt: Date = new Date();
    receiver: string;
    sender: string;
    attachment?: string;

    static fromSnapshot(
        snapshot: firebase.firestore.QueryDocumentSnapshot,
        channel: ChannelModel,
    ): DecryptedMessage {
        const { createdAt, body, sender, receiver, attachment } = snapshot.data() as IMessageData;
        console.log('snapshot.data()', snapshot.data())
        const message = new DecryptedMessage(
            { body, createdAt: createdAt.toDate(), id: snapshot.id, sender, receiver, attachment },
            channel,
        );
        return message;
    }

    static fromJSON(json: IMessage, channel: ChannelModel) {
        const message = new DecryptedMessage(json, channel);
        return message;
    }

    constructor(
        { sender, receiver, body, createdAt, id, attachment }: IDecryptedMessageProps,
        private channel: ChannelModel,
    ) {
        this.id = id;
        this.body = body;
        this.receiver = receiver;
        this.sender = sender;
        this.attachment = attachment;
        if (createdAt) this.createdAt = createdAt;
    }

    async encrypt(eThree: EThree): Promise<EncryptedMessage> {
        if (!this.body) throw new Error('message is empty');
        const publicKeys = await this.channel.publicKeys;
        const senderPublicKey = publicKeys[this.channel.getMember(this.receiver).uid];
        if (!senderPublicKey) throw new Error('Public Key for ' + this.sender + ' not found');
        const message = await eThree.encrypt(this.body, senderPublicKey);
        return new EncryptedMessage({ ...this, body: message }, this.channel, eThree);
    }

    async send(message: string, attachment?: string) {
        this.body = message;
        this.attachment = attachment;
        this.channel.sendMessage();
    }

    toJSON(): IMessage {
        const { id, body } = this;
        if (!body) throw new Error('no body');
        if (!id) throw new Error('message not saved');
        return {
            id: id,
            body: body,
            createdAt: this.createdAt,
            sender: this.sender,
            receiver: this.receiver,
            attachment: this.attachment
        };
    }

    addAttachment(
        file: Blob,
        onProgress: (percent: number) => void,
    ): Promise<string> {
        const filename = Date.now().toString();
        const uploadTask = this.channel.uploadFile(filename, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                snapshot => {
                    const progress = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                    );
                    onProgress(progress);
                },
                error => reject(error),
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(url => {
                        this.attachment = url;
                        resolve(url);
                    });
                }
            );
        });
    }
}

export class EncryptedMessage {
    id?: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
    attachment?: string;

    static fromSnapshot(
        snapshot: firebase.firestore.QueryDocumentSnapshot,
        channel: ChannelModel,
        eThree: EThree,
    ): EncryptedMessage {

        return new EncryptedMessage(
            {
                id: snapshot.id,
                ...(snapshot.data() as IMessageData),
                createdAt: snapshot.data().createdAt.toDate(),
            },
            channel,
            eThree,
        );
    }

    constructor(
        { id, body, createdAt, receiver, sender, attachment }: IEncryptedMessageProps,
        private channel: ChannelModel,
        private eThree: EThree,
    ) {
        this.id = id;
        this.body = body;
        this.createdAt = createdAt;
        this.receiver = receiver;
        this.sender = sender;
        this.attachment = attachment;
    }

    async decrypt(): Promise<DecryptedMessage> {
        const publicKeys = await this.channel.publicKeys;

        const senderPublicKey = publicKeys[this.channel.getMember(this.sender).uid];
        if (!senderPublicKey) throw new Error('Public Key for ' + this.sender + ' not found');
        const message = await this.eThree.decrypt(this.body, senderPublicKey);
        return new DecryptedMessage({ ...this, body: message }, this.channel);
    }
}
