import React from 'react';
import styled from 'styled-components';
import { SecondaryButton } from '../components/Primitives';
import { DecryptedMessage } from '../models/MessageModel';

export const inputHeight = '100px';

const MessageContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 100px 20px;
`;

const MessageFieldContainer = styled.form`
    width: 100%;
    height: ${inputHeight};
    flex: 0 0 auto;
    display: flex;
`;

const MessageFieldElement = styled.textarea`
    flex: 1 1 auto;
    border: 0;
    border-bottom: 2px solid #9e3621;
`;

const ImgPreview = styled.img`
    max-width: 120px;
    max-height: 100px; 
`

export interface IMessageFieldProps {
    message: DecryptedMessage;
    handleSend: (message: string) => void;
}

export interface IMessageFieldState {
    message: string;
    fileProgress?: number;
    imgSrc?: string;
}

export default class MessageField extends React.Component<IMessageFieldProps, IMessageFieldState> {
    state: IMessageFieldState = {
        message: '',
    };

    handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        this.props.handleSend(this.state.message);
        this.setState({ message: '' });
    };

    handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ message: e.target.value });
    };

    onProgressChange = (progress: number) => {
        this.setState(state => ({ ...state, fileProgress: progress }));
    };

    onImageLoaded = (imgSrc: string) => this.setState(state => ({ ...state, imgSrc }));

    handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        if (!e.target.files[0]) return;
        const file = e.target.files[0];
        this.props.message.addAttachment(file, this.onProgressChange).then(this.onImageLoaded);
    };

    handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (this.state.message.trim() === '') return;
        if (e.keyCode === 13 && !e.ctrlKey) {
            e.preventDefault();
            this.props.message.send(this.state.message, this.state.imgSrc);
            this.setState({ message: '' });
        } else if (e.ctrlKey) {
            this.setState(state => ({ message: state.message + '\n' }));
        }
    };

    render() {
        return (
            <MessageContainer>
                <MessageFieldContainer onSubmit={this.handleSend}>
                    <MessageFieldElement
                        placeholder="write a message"
                        value={this.state.message}
                        onChange={this.handleMessageChange}
                        onKeyUp={this.handleEnter}
                    />
                    <SecondaryButton disabled={this.state.message.trim() === ''}>
                        send
                    </SecondaryButton>
                </MessageFieldContainer>
                {this.renderMedia()}
            </MessageContainer>
        );
    }

    private renderMedia = () => {
        if (this.state.imgSrc) return <ImgPreview src={this.state.imgSrc} />;
        if (this.state.fileProgress && !this.state.imgSrc) {
            return `Uploading image: ${this.state.fileProgress}%`;
        }
        return <input type="file" onChange={this.handleUploadFile} />
    }
}
