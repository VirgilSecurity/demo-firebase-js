import * as React from 'react';
import styled from 'styled-components';
import AuthForm, { IAuthFormValues } from '../components/AuthForm';
import { FormikHelpers as FormikActions } from 'formik';
import UserApi from '../models/UserModel';
import { IAppStore } from '../models/AppState';

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

export interface IAuthPageProps {
    store: IAppStore;
    model: UserApi;
}


class AuthPage extends React.Component<IAuthPageProps> {
    handleSignUp = async (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => {
        const UserApi = this.props.model;
        try {
            await UserApi.signUp(values.username, values.password, values.brainkeyPassword);
        } catch (e) {
            actions.setErrors({ username: e.message });
            throw e;
        }
    };

    handleSignIn = async (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => {
        const UserApi = this.props.model;
        try {
            await UserApi.signIn(values.username, values.password, values.brainkeyPassword);
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

export default AuthPage;
