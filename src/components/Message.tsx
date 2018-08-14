import * as React from 'react';
import styled from 'styled-components';
import { Avatar } from './Primitives';
import { IMessage } from './Messages';
import format from 'date-fns/format';

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

export default (props: IMessageProps) => {
    return (
        <MessageContainer>
            <MessageAvatar src="https://source.unsplash.com/random" />
            <MessageContent>
                <MessageHeader>
                    <h3>{props.message.sender}</h3>
                    <span>{format(props.message.createdAt, 'HH:mm:ss')}</span>
                </MessageHeader>
                <MessageBody>{props.message.body === '' ? '*Message Deleted*' : props.message.body}</MessageBody>
            </MessageContent>
        </MessageContainer>
    );

}