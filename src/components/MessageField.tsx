import React from 'react';
import styled from 'styled-components';
import { SecondaryButton } from '../components/Primitives';

export const inputHeight = '100px';

const MessageFieldContainer = styled.form`
    width: 100%;
    height: ${inputHeight};
    flex: 0 0 auto;
    padding: 20px 100px 20px;
    display: flex;
`;

const MessageFieldElement = styled.textarea`
    flex: 1 1 auto;
    border: 0;
    border-bottom: 2px solid #9e3621;
`;

export interface IMessageFieldProps {
    handleSend: (message: string) => void;
}

export interface IMessageFieldState {
    message: string;
}

export default class MessageField extends React.Component<IMessageFieldProps, IMessageFieldState> {
    state = {
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

    handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (this.state.message.trim() === '') return;
        if (e.keyCode === 13 && !e.ctrlKey) {
            e.preventDefault();
            this.props.handleSend(this.state.message)
            this.setState({ message: '' });
        } else if (e.ctrlKey) {
            this.setState(state => ({ message: state.message + '\n' }));
        }
    }

    render() {
        return (
            <MessageFieldContainer onSubmit={this.handleSend}>
                <MessageFieldElement
                    placeholder="write a message"
                    value={this.state.message}
                    onChange={this.handleMessageChange}
                    onKeyUp={this.handleEnter}
                />
                <SecondaryButton disabled={this.state.message.trim() === ''}>send</SecondaryButton>
            </MessageFieldContainer>
        );
    }
}
