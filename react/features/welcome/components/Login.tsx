/* eslint-disable flowtype/no-types-missing-file-annotation */
/* eslint-disable react/no-multi-comp */
import React, { FC, useState } from 'react';

import { isDomainPremium, premiumDomain, isUserPaid } from '../../../../limitations.ts';

interface Props {
    closeLoginPrompt: () => void
}

interface InnerProps extends Props {
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleSubmit: () => void,
    isEnteringCode: boolean,
    error: string
}

interface RequestOptions {
    address: string,
    body: any,
    error: string,
    callback: () => void
}

const requestApi = async (address: string, body: any) => {
    const request = await fetch(`https://matrix.easy-stars.ru/bot/connect/${address}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const json = await request.json();

    return json;
};

const checkAfterLogin = async () => {
    const isPaid = await isUserPaid();

    if (!isDomainPremium && isPaid) {
        const res = await fetch('https://matrix.easy-stars.ru/bot/redirect/get-hash', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                username: localStorage.getItem('username')
            })
        });

        const result = await res.json();

        if (result.hash) {
            // eslint-disable-next-line prefer-template
            window.location.href = premiumDomain + `?hash=${result.hash}`;
        }
    }
};

const Login: FC<Props> = ({ closeLoginPrompt }: Props) => {
    const [ loginName, changeLoginName ] = useState('');
    const [ confirmationCode, changeConfirmationCode ] = useState('');
    const [ isEnteringCode, changeIsEnteringCode ] = useState(false);
    const [ error, setError ] = useState('');

    const options: { [key: string]: RequestOptions } = {
        login: {
            address: 'send-code',
            body: {
                username: loginName
            },
            callback: () => {
                changeIsEnteringCode(true);
                setError('');
            },
            error: 'Пользователь не найден'
        },
        code: {
            address: 'check-code',
            body: {
                code: confirmationCode
            },
            callback: checkAfterLogin,
            error: 'Неверный код'
        }
    };

    const handleSubmit = async () => {
        const { login, code } = options;
        const { address, body, callback, error: optionError } = isEnteringCode ? code : login;

        const res = await requestApi(address, body);

        if (res.status === 'OK') {
            if (isEnteringCode) {
                localStorage.setItem('username', res.username);
            }

            callback();

            if (isEnteringCode) {
                window.location.href = window.location.href;
            }
        } else {
            setError(optionError);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        isEnteringCode ? changeConfirmationCode(value) : changeLoginName(value);
    };

    return (
        <InnerLogin
            closeLoginPrompt = { closeLoginPrompt }
            error = { error }
            handleInput = { handleInput }
            handleSubmit = { handleSubmit }
            isEnteringCode = { isEnteringCode } />
    );
};

const InnerLogin: FC<InnerProps> = ({
    closeLoginPrompt, handleInput, handleSubmit, error, isEnteringCode
}: InnerProps) => (
    <div className = 'login'>
        <div className = 'login-form'>
            <div className = 'login-top'>
                <h2>Войти</h2>
                <button
                    className = 'interactive close'
                    onClick = { closeLoginPrompt } >
                Закрыть
                </button>
            </div>

            <input
                className = 'interactive login-input'
                key = { `isEnteringCode${isEnteringCode}` }
                onChange = { handleInput }
                placeholder = { isEnteringCode ? 'Код подтверждения' : 'Логин в telegram' }
                type = 'text' />

            {error && <p className = 'error'>{error}</p>}

            <button
                className = 'interactive login-submit'
                onClick = { handleSubmit }>
                    Отправить
            </button>
        </div>
    </div>
);

export default Login;
