import * as React from 'react';
import styled from 'styled-components';
import AuthForm, { IAuthFormValues } from './components/AuthForm';
import { withRouter, RouteComponentProps } from 'react-router';
import { Routes } from './services/Routes';
import { FormikActions } from 'formik';
import UserApi from './services/UserApi';

const Background = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
`;

const CenterCard = styled.div`
    display: flex;
    min-height: 250px;
    width: 400px;
    border: 1px solid #ebebeb;
    border-radius: 3px;
    box-shadow: 0 2px 40px 2px rgba(26, 29, 36, 0.16);
    padding: 25px;
    flex-direction: column;
`;

export interface IAuthPageProps {}

export interface IAuthPageState {
    username: string;
    password: string;
}

class AuthPage extends React.Component<RouteComponentProps<IAuthPageProps>, IAuthPageState> {
    state: IAuthPageState = {
        username: '',
        password: '',
    };

    handleSignUp = async (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => {
        try {
            await UserApi.signUp(values.username, values.password);
            this.props.history.push(Routes.index);
        } catch (e) {
            actions.setErrors({ username: e.message });
        }
    };

    handleSignIn = async (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => {
        try {
            await UserApi.signIn(values.username, values.password);
            this.props.history.push(Routes.index);
        } catch (e) {
            actions.setErrors({ username: e.message });
            throw e;
        }
    };
    
    render() {
        return (
            <Background>
                <CenterCard>
                    <AuthForm onSignIn={this.handleSignIn} onSignUp={this.handleSignUp} />
                </CenterCard>
            </Background>
        );
    }
}

export default withRouter(AuthPage);
