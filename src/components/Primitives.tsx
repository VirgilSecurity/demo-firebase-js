import styled from 'styled-components';

export const Button = styled.button`
    font-family: 'Muller';
    font-size: 14px;
    display: inline-flex;
    justify-content: center;
    height: 44px;
    transition: all 0.5s;
    text-transform: uppercase;
    border: 0;
    border-radius: 3px;
`;

export const PrimaryButton = Button.extend`
    color: white;
    background-color: #9e3621;
    box-shadow: 0 15px 20px -15px rgba(158, 54, 33, 0.5);
    padding: 0 25px;

    &:hover:not(:disabled) {
        background-color: #da322c;
    }

    &:disabled {
        opacity: 0.5;
    }
`;

export const SecondaryButton = Button.extend`
    --webkit-appearance: none;
    border: 0;
    display: inline-block;
    padding: 16px 19px;
    color: #9e3621;
    margin: 2px;
    font-family: Muller;
    text-transform: uppercase;
    text-decoration: none;

    &:disabled {
        color: #ebebeb;
    }
`;

export const Avatar = styled.div`
    height: 50px;
    width: 50px;
    line-height: 50px;
    border-radius: 50px;
    text-align: center;
    font-size: 24px;
    background-color: lightgray;
`;

export const LinkButton = styled.a`
    --webkit-appearance: none;
    border: 0;
    display: inline-block;
    padding: 16px 19px;
    color: ${props => props.color};
    font-family: Muller;
    text-transform: uppercase;
    text-decoration: none;

    &:hover {
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.1)
    }
`