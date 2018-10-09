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

    renderBrainKeyPasswordInput = ({ field }: FieldProps<IAuthFormValues>) => {
        return <InputField label="private key password" type="password" {...field} />;
    };

    renderCheckbox = ({ field }: FieldProps<IAuthFormValues>) => {
        // tslint:disable-next-line:no-any
        const onChange = (e: any) => {
            this.setState(state => ({
                isMultiDeviceSupportEnabled: !state.isMultiDeviceSupportEnabled,
            }));
            field.onChange(e);
        };
        return (
            <label>
                <input type="checkbox" onChange={onChange} /> Enable multi device support
            </label>
        );
    };

    onSubmit: formikSubmit = (values, actions) => {
        if (this.state.isSingInClicked) {
            this.props.onSignIn(values, actions);
        } else {
            this.props.onSignUp(values, actions);
        }
    }

    renderForm = ({ values, isValid }: FormikProps<IAuthFormValues>) => {
        const isDisabled = values.username === '' || values.password === '' || !isValid;
        return (
            <Form>
                <Field name="username" render={this.renderEmailInput} />
                <Field name="password" render={this.renderPasswordInput} />
                {this.state.isMultiDeviceSupportEnabled && (
                    <Field name="brainkeyPassword" render={this.renderBrainKeyPasswordInput} />
                )}
                <Field component="input" render={this.renderCheckbox} />
                <Buttons>
                    <PrimaryButton
                        disabled={isDisabled}
                        type="submit"
                        onClick={() => this.setState({ isSingInClicked: true })}
                    >
                        Sign In
                    </PrimaryButton>
                    <PrimaryButton
                        disabled={isDisabled}
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
