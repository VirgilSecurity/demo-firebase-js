import React from 'react';
import { Formik, Form, Field, FieldProps, FormikActions } from 'formik';
import InputField from './InputField';
import { PrimaryButton } from './Button';

export interface IAuthFormValues {
    email: string;
    password: string;
}

export interface IAuthFormProps {
    action: string;
    onSubmit: (values: IAuthFormValues, actions: FormikActions<IAuthFormValues>) => void;
}

export default class AuthForm extends React.Component<IAuthFormProps> {
    renderEmailInput = ({ field, form }: FieldProps<IAuthFormValues>) => {
        return (
            <InputField
                label="email"
                error={
                    form.touched.email && form.errors.email ? (form.errors.email as string) : null
                }
                {...field}
            />
        );
    };

    renderPasswordInput = ({ field, form }: FieldProps<IAuthFormValues>) => {
        return (
            <InputField
                label="password"
                error={
                    form.touched.password && form.errors.password
                        ? (form.errors.password as string)
                        : null
                }
                {...field}
            />
        );
    };

    renderForm = () => (
        <Form>
            <Field name="email" render={this.renderEmailInput} />
            <Field name="password" render={this.renderPasswordInput} />
            <PrimaryButton type="submit">{this.props.action}</PrimaryButton>
        </Form>
    );

    render() {
        return (
            <Formik
                initialValues={{ email: '', password: '' }}
                onSubmit={this.props.onSubmit}
                render={this.renderForm}
            />
        );
    }
}
