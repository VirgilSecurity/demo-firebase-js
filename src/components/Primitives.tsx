import styled from 'styled-components';

export const Button = styled.button`
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

export const PrimaryButton = Button.extend`
    color: white;
    background-color: #9e3621;
    box-shadow: 0 15px 20px -15px rgba(158, 54, 33, 0.5);
    padding: 0 25px;

    &:hover {
        background-color: #da322c;
    }
`;

export const Avatar = styled.div`
    height: 50px;
    width: 50px;
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    background-color: lightgray;
`;