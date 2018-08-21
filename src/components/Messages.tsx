import * as React from 'react';
import Message from './Message';
import styled from 'styled-components';
import { inputHeight } from './MessageField';

const MessageWrapper = styled.div`
    flex: 1 0 auto;
    width: 100%;
    overflow: scroll;
    max-height: calc(100% - ${inputHeight});
    padding: 25px 100px 0;
`;

export interface IMessage {
    id: string;
    body: string;
    createdAt: Date;
    receiver: string;
    sender: string;
}

export interface IMessagesProps {
    messages: IMessage[];
}

export default class Messages extends React.Component<IMessagesProps> {
    ref?: HTMLElement;

    componentDidUpdate() {
        if (this.ref) {
            this.ref.scrollTo({ top: this.ref.scrollHeight })
        }
    }

    render() {

        const messages = this.props.messages.map(message => (
            <Message key={message.createdAt.getTime()} message={message} />
        ));

        return <MessageWrapper innerRef={ref => {this.ref = ref}}>
            {messages}
        </MessageWrapper>;
    }
}
