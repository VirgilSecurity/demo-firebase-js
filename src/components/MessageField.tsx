import React from 'react';
import styled from 'styled-components';

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
    border-bottom: 1px solid blue;
`;

const SendButton = styled.button`
    border: 0;
    background: 0;
    cursor: pointer;
    font-size: 18px;
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

    render() {
        return (
            <MessageFieldContainer onSubmit={this.handleSend}>
                <MessageFieldElement
                    value={this.state.message}
                    onChange={this.handleMessageChange}
                />
                <SendButton disabled={!this.state.message.length}>send</SendButton>
            </MessageFieldContainer>
        );
    }
}
