import * as React from 'react';
import styled from 'styled-components';
import AuthForm, { IAuthFormValues } from './components/AuthForm';
import { withRouter, RouteComponentProps } from 'react-router';
import { Routes } from './model/Routes';
import firebase from 'firebase';
import { FormikBag, FormikActions } from 'formik';

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

export interface IAuthPageProps {}

export interface IAuthPageState {
    email: string;
    password: string;
}

class AuthPage extends React.Component<RouteComponentProps<IAuthPageProps>, IAuthPageState> {
    state: IAuthPageState = {
        email: '',
        password: '',
    };

    handleSignUp = (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => {
        firebase
            .auth()
            .createUserWithEmailAndPassword(values.email, values.password)
            .then(() => this.props.history.push(Routes.index))
            .catch(e =>
                actions.setErrors({ email: e.message }),
            );
    };

    handleSignIn = (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) =>
        firebase
            .auth()
            .signInWithEmailAndPassword(values.email, values.password)
            .then(() => this.props.history.push(Routes.index))
            .catch(e =>
                actions.setErrors({
                    email: e.message,
                }),
            );

    render() {
        const { match } = this.props;
        const isLogin = match.path === Routes.singIn;
        const action = isLogin ? 'Sign In' : 'Sign Up';
        return (
            <Background>
                <CenterCard>
                    <AuthForm
                        action={action}
                        onSubmit={isLogin ? this.handleSignIn : this.handleSignUp}
                    />
                </CenterCard>
            </Background>
        );
    }
}

export default withRouter(AuthPage);
