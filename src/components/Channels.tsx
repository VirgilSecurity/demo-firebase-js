import * as React from 'react';
import styled from 'styled-components';
import { Avatar } from './Primitives';

const SideBarItem = styled.button`
    height: 80px;
    width: 100%;
    padding: 20px;
    display: flex;
    align-items: center;
    border: 0;
`;

const Username = styled.div`
    display: flex;
    align-items: center;
    flex: 1 0 auto;
    padding: 20px;
`;

export interface IChannel {
    id: string;
    count: number;
    members: string[];
}

export interface IChannelsProps {
    channels: IChannel[];
    onClick: (channel: IChannel) => void;
}

export default class Channels extends React.Component<IChannelsProps> {

    renderItem = (item: IChannel) => {
        return (
            <SideBarItem onClick={() => this.props.onClick(item)} key={item.members[1]}>
                <Avatar src={"https://source.unsplash.com/random/"} />
                <Username>{item.members[1]}</Username>
            </SideBarItem>
        );
    };

    render() {
        return this.props.channels.map(channel => this.renderItem(channel));
    }
}
