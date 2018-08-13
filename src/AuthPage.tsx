import * as React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react';
import { injectStore, IWithStore } from './model/Store';
import { LoginField } from './model/Field';

export interface IAuthPageProps extends IWithStore {}

export interface IAuthPageState {
    email: string;
    password: string;
}

const Background = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
`;

const CenterCard = styled.div`
    display: flex;
    height: 300px;
    width: 400px;
    border: 1px solid #ebebeb;
    border-radius: 3px;
    box-shadow: 0 2px 40px 2px rgba(26, 29, 36, 0.16);
    padding: 25px;
    flex-direction: column;
`;

const Label = styled.label`
    font-size: 11px;
    font-family: 'Muller';
    text-transform: uppercase;
    font-weight: bold;
    color: #a6a6a6;
    display: flex;
    flex-direction: column;
    width: 100%;

    &:nth-child(n + 1) {
        margin-bottom: 20px;
    }
`;

const Input = styled.input`
    border: 1px solid #a6a6a6;
    color: #333;
    border-radius: 3px;
    padding: 0 16px;
    height: 44px;
    margin-top: 10px;
    width: 100%;
    display: inline-block;

    &:hover {
        border: 1px solid #333;
    }
`;

const Button = styled.button`
    font-family: 'Muller';
    font-size: 14px;
    display: flex;
    justify-content: center;
    height: 44px;
    transition: all 0.5s;
    text-transform: uppercase;
    border: 0;
    border-radius: 3px;
`;

const PrimaryButton = Button.extend`
    color: white;
    background-color: #9e3621;
    box-shadow: 0 15px 20px -15px rgba(158, 54, 33, 0.5);
    padding: 0;

    &:hover {
        background-color: #da322c;
    }
`;

@injectStore()
@observer
export default class AuthPage extends React.Component<IAuthPageProps, IAuthPageState> {
    state: IAuthPageState = {
        email: '',
        password: '',
    };

    loginField = new LoginField();

    handleAuth = () => {

        this.props.store!.user.signIn(this.loginField.value, this.state.password);
    };


    handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.state.password = e.target.value;
    };

    render() {
        return (
            <Background>
                <CenterCard>
                    <Label>
                        email:
                        <Input onChange={this.loginField.handleChange} />
                        {this.loginField.error && <p>{this.loginField.error}</p>}
                    </Label>
                    <Label>
                        password:
                        <Input onChange={this.handlePasswordChange} />
                    </Label>
                    <PrimaryButton onClick={this.handleAuth}>Login</PrimaryButton>
                </CenterCard>
            </Background>
        );
    }
}
