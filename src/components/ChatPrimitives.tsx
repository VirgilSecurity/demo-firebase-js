import styled from 'styled-components';
import { PrimaryButton } from './Primitives';

export const ChatContainer = styled.div`
    max-width: 1024px;
    min-width: 600px;
    margin: 0 auto;
    background-color: white;
`;

export const Header = styled.header`
    width: 100%;
    height: 50px;
    background-color: #9e3621;
    display: flex;
    justify-content: space-between;
`;

export const ChatLayout = styled.div`
    display: flex;
    height: calc(100vh - 50px);
`;

export const SideBar = styled.aside`
    width: 250px;
    border-right: 2px solid grey;
    flex: 0 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export const ChatWorkspace = styled.main`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

export const BottomPrimaryButton = styled(PrimaryButton)`
    margin: 10px 0px;
`;

export const RightSide = styled.span`
    color: white;
`;
