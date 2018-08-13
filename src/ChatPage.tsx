import * as React from 'react';
import styled from 'styled-components';
import { IWithStore, injectStore } from './model/Store';
import { observer } from 'mobx-react';

const ChatLayout = styled.div`
    display: flex;
`;

const SideBar = styled.aside`
    width: 240px;
    height: 100vh;
    border-right: 2px solid grey;
`;

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

export interface IChatPageProps extends IWithStore {}

@injectStore()
@observer
export default class ChatPage extends React.Component<IChatPageProps> {
    render() {
        return (
            <ChatLayout>
                <SideBar>
                    <button>new conversation</button>
                    <button onClick={this.props.store!.user.signOut}>sign out</button>
                    <hr />
                    <SideBarItem>
                        <Avatar src="https://lh3.googleusercontent.com/-ExpzmdxYDDw/AAAAAAAAAAI/AAAAAAAAAAA/AAnnY7pqObCl47CPnKiWN42jTYi3_7Sc2g/s192-c-mo/photo.jpg" />
                        <Username>Hello</Username>
                    </SideBarItem>
                </SideBar>
            </ChatLayout>
        );
    }
}
