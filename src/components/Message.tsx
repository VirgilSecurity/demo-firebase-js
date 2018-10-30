import * as React from 'react';
import styled from 'styled-components';
import { Avatar } from './Primitives';
import format from 'date-fns/format';
import { IMessage } from '../models/MessageListModel';

const MessageContainer = styled.div`
    width: 100%;
    min-height: 100px;
    display: flex;
`

const MessageContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
    max-width: calc(100% - 100px);
`

const MessageHeader = styled.span`
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const MessageBody = styled.div`
    overflow: hidden;
    word-break: break-all;
`

const MessageAvatar = Avatar.extend`
    margin: 25px;
    flex: 0 0 auto;
`


export interface IMessageProps {
    message: IMessage;
}

export default function Message({ message }: IMessageProps) {
    return (
        <MessageContainer>
            <MessageAvatar>{message.sender.username.slice(0, 2).toUpperCase()}</MessageAvatar>
            <MessageContent>
                <MessageHeader>
                    <h3>{message.sender.username}</h3>
                    <span>{format(message.createdAt, 'HH:mm:ss')}</span>
                </MessageHeader>
                <MessageBody>{message.body === '' ? '*Message Deleted*' : message.body}</MessageBody>
            </MessageContent>
        </MessageContainer>
    );

}