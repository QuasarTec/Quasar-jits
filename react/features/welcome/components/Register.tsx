/* eslint-disable flowtype/no-types-missing-file-annotation */
/* eslint-disable react/no-multi-comp */
import React, { FC, useState } from 'react';

interface Props {
  closeRegisterWindow: () => void
}

interface InnerProps extends Props {
  updateState: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Register: FC<Props> = ({ closeRegisterWindow }: Props) => {
    const [ username, changeUsername ] = useState('');
    const [ email, changeEmail ] = useState('');
    const [ password, changePassword ] = useState('');

    const dataObj = {
        username: changeUsername,
        email: changeEmail,
        password: changePassword
    };

    const updateStateFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, name } = e.target;

        dataObj[name](value);
    };

    return (
        <InnerRegister
            closeRegisterWindow = { closeRegisterWindow }
            updateState = { updateStateFromInput } />
    );
};

const InnerRegister: FC<InnerProps> = ({
    closeRegisterWindow, updateState
}: InnerProps) =>
    (<div className = 'login'>
        <div className = 'login-form'>
            <div className = 'login-top'>
                <h2>Регистрация</h2>
                <button
                    className = 'interactive close'
                    onClick = { closeRegisterWindow } >
                    Закрыть
                </button>
            </div>

            <input
                type = 'text'
                placeholder = 'Введите ваш telegram' />
            <input
                type = 'email'
                placeholder = 'Введите ваш email' />
            <input
                type = 'password'
                placeholder = 'Введите ваш пароль' />

            <button
                className = 'interactive login-submit'
                onClick = { handleSubmit }>
            Отправить
            </button>
        </div>
    </div>)
;

export default Register;
