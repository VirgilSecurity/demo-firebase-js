import React from 'react';
import { Formik, Form, Field, FieldProps, FormikActions, FormikProps, FormikErrors } from 'formik';
import InputField from './InputField';
import { PrimaryButton } from './Primitives';
import styled from 'styled-components';

const Buttons = styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
`;

export interface IAuthFormValues {
    username: string;
    password: string;
    brainkeyPassword: string;
}

type formikSubmit = (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => void;

export interface IAuthFormProps {
    onSignIn: formikSubmit;
    onSignUp: formikSubmit;
}

export interface IAuthFormState {
    isSingInClicked: boolean;
    isMultiDeviceSupportEnabled: boolean;
}

export default class AuthForm extends React.Component<IAuthFormProps, IAuthFormState> {
    state = { isSingInClicked: false, isMultiDeviceSupportEnabled: false };

    validateForm = (values: IAuthFormValues) => {
        let errors: FormikErrors<IAuthFormValues> = {};
        if (!/^[a-zA-Z0-9._]+$/.test(values.username)) {
            errors.username = 'only latin symbols, numbers, dot and underscore allowed';
        }

        if (values.password === '' || values.password == null) {
            errors.password = 'required';
        }

        if (values.brainkeyPassword === '' || values.brainkeyPassword == null) {
            errors.brainkeyPassword = 'required';
        }

        if (values.brainkeyPassword === values.password) {
            errors.brainkeyPassword = 'password and private key passwords must be different'
        }

        return errors;
    };

    renderEmailInput = ({ field, form }: FieldProps<IAuthFormValues>) => {
        const error =
            form.touched.username && form.errors.username ? (form.errors.username as string) : null;

        return <InputField label="username" error={error} {...field} />;
    };

    renderPasswordInput = ({ field, form }: FieldProps<IAuthFormValues>) => {
        const error =
            form.touched.password && form.errors.password ? (form.errors.password as string) : null;
        return <InputField label="password" type="password" error={error} {...field} />;
    };

    renderBrainKeyPasswordInput = ({ field, form }: FieldProps<IAuthFormValues>) => {
        const error =
            form.touched.brainkeyPassword && form.errors.brainkeyPassword
                ? (form.errors.brainkeyPassword as string)
                : null;
        return <InputField label="private key password" type="password" error={error} {...field} />;
    };

    onSubmit: formikSubmit = (values, actions) => {
        if (this.state.isSingInClicked) {
            this.props.onSignIn(values, actions);
        } else {
            this.props.onSignUp(values, actions);
        }
    };

    renderForm = ({ isValid }: FormikProps<IAuthFormValues>) => {
        return (
            <Form>
                <Field name="username" render={this.renderEmailInput} />
                <Field name="password" render={this.renderPasswordInput} />
                <Field name="brainkeyPassword" render={this.renderBrainKeyPasswordInput} />
                <Buttons>
                    <PrimaryButton
                        disabled={!isValid}
                        type="submit"
                        onClick={() => this.setState({ isSingInClicked: true })}
                    >
                        Sign In
                    </PrimaryButton>
                    <PrimaryButton
                        disabled={!isValid}
                        type="submit"
                        onClick={() => this.setState({ isSingInClicked: false })}
                    >
                        Sign Up
                    </PrimaryButton>
                </Buttons>
            </Form>
        );
    };

    render() {
        return (
            <Formik
                validate={this.validateForm}
                initialValues={{ username: '', password: '', brainkeyPassword: '' }}
                onSubmit={this.state.isSingInClicked ? this.props.onSignIn : this.props.onSignUp}
                render={this.renderForm}
            />
        );
    }
}
