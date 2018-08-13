import * as React from 'react';
import styled from 'styled-components';

const SideBarItem = styled.button`
    height: 80px;
    width: 100%;
    padding: 20px;
    display: flex;
    align-items: center;
    border: 0;
`;

const Avatar = styled.img`
    height: 48px;
    width: 48px;
    border-radius: 48px;
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
    loadChannel: (channel: IChannel) => void;
}

export default class Channels extends React.Component<IChannelsProps> {
    renderItem = (item: IChannel) => {
        return (
            <SideBarItem onClick={() => this.props.loadChannel(item)} key={item.members[1]}>
                <Avatar src="https://lh3.googleusercontent.com/-ExpzmdxYDDw/AAAAAAAAAAI/AAAAAAAAAAA/AAnnY7pqObCl47CPnKiWN42jTYi3_7Sc2g/s192-c-mo/photo.jpg" />
                <Username>{item.members[1]}</Username>
            </SideBarItem>
        );
    };

    render() {
        return this.props.channels.map(channel => this.renderItem(channel));
    }
}
