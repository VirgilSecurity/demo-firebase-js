import * as React from 'react';
import styled from 'styled-components';
import { Avatar } from './Primitives';
import ChannelModel, { IChannel } from '../services/ChannelModel';

const ChannelsWrapper = styled.div`
    flex: 1 0 auto;
    max-height: calc(100vh - 130px);
    overflow: scroll;
`;

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

export interface IChannelsProps {
    channels: IChannel[];
    username: string;
    onClick: (channel: IChannel) => void;
}

export default class Channels extends React.Component<IChannelsProps> {
    renderItem = (item: ChannelModel) => {
        const receiver = item.members.filter(e => e !== this.props.username)[0];

        return (
            <SideBarItem onClick={() => this.props.onClick(item)} key={item.id}>
                <Avatar>{receiver.slice(0, 2).toUpperCase()}</Avatar>
                <Username>{receiver}</Username>
            </SideBarItem>
        );
    };

    render() {
        return (
            <ChannelsWrapper>
                {this.props.channels.map(channel => this.renderItem(channel))}
            </ChannelsWrapper>
        );
    }
}
