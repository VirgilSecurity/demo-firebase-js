import React from 'react';
import styled from 'styled-components';

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

export interface IInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | null;
}

export default class InputField extends React.Component<IInputFieldProps> {
    render() {
        const { label, error, ...props } = this.props;
        return (
            <Label>
                {label}
                <Input {...props}/>
                {error && <p>{error}</p>}
            </Label>
        );
    }
}