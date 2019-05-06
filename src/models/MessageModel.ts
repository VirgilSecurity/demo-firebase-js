import { IMessage } from './MessageListModel';
import { EThree } from '@virgilsecurity/e3kit';
import ChannelModel from './ChannelModel';
import firebase from 'firebase';

export interface IMessage {
    id: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
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
        channel: ChannelModel
    ): DecryptedMessage {
        const { createdAt, body, sender, receiver } = snapshot.data() as IMessageData;
        const message = new DecryptedMessage(
            { body, createdAt: createdAt.toDate(), id: snapshot.id, sender, receiver },
            channel
        );
        return message;
    }

    static fromJSON(json: IMessage, channel: ChannelModel) {
        const message = new DecryptedMessage(json, channel);
        return message;
    }

    constructor(
        { sender, receiver, body, createdAt, id }: IDecryptedMessageProps,
        private channel: ChannelModel,
    ) {
        this.id = id;
        this.body = body;
        this.receiver = receiver;
        this.sender = sender;
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

    async send() {
        this.channel.sendMessage();
    }

    toJSON(): IMessage {
        const { id, body } = this
        if (!body) throw new Error('no body');
        if (!id) throw new Error('message not saved');
        return {
            id: id,
            body: body,
            createdAt: this.createdAt,
            sender: this.sender,
            receiver: this.receiver
        }
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
        { id, body, createdAt, receiver, sender }: IEncryptedMessageProps,
        private channel: ChannelModel,
        private eThree: EThree,
    ) {
        this.id = id;
        this.body = body;
        this.createdAt = createdAt;
        this.receiver = receiver;
        this.sender = sender;
    }

    async decrypt(): Promise<DecryptedMessage> {
        const publicKeys = await this.channel.publicKeys;

        const senderPublicKey = publicKeys[this.channel.getMember(this.sender).uid];
        if (!senderPublicKey) throw new Error('Public Key for ' + this.sender + ' not found');
        const message = await this.eThree.decrypt(this.body, senderPublicKey);
        return new DecryptedMessage({ ...this, body: message }, this.channel);
    }
}
