/* eslint-disable flowtype/no-types-missing-file-annotation */
/* eslint-disable react/no-multi-comp */
import React, { FC, useState } from 'react';
import stringify from '../../../../modules/helpers/stringify.ts';

enum HooksNames {
    username = 'username', 
    email = 'email', 
    password = 'password',
    referral = 'referral'
}

type HooksInterface = {
    [key in HooksNames]: React.Dispatch<React.SetStateAction<string>>
}

interface Input {
    type: string,
    name: HooksNames,
    placeholder: string,
    optional?: boolean
}

interface Props {
    closeRegisterWindow: () => void
}

interface InnerProps extends Props {
    updateState: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleSubmit: () => void,
    errors: string[]
}

const Register: FC<Props> = ({ closeRegisterWindow }: Props) => {
    const [ username, changeUsername ] = useState('');
    const [ email, changeEmail ] = useState('');
    const [ password, changePassword ] = useState('');
    const [ referral, changeRefferal ] = useState('');
    const [ errors, setErrors ] = useState<string[]>([]);

    const hooks: HooksInterface = {
        [HooksNames.username]: changeUsername,
        [HooksNames.email]: changeEmail,
        [HooksNames.password]: changePassword,
        [HooksNames.referral]: changeRefferal
    };

    const updateStateFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, name } = e.target;

        hooks[name as HooksNames](value);
    };

    const submitData = async () => {
        const body: any = { username, email, password }
        if (referral) body.referral = referral;

        const query = stringify(body);
        
        const res = await fetch(`https://api.quasaria.ru/api/query/user/register`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
            },
            body: query
        });

        const result = await res.json();

        if (result.status === 'error') {
            const response = result.response_text;
            const keys = Object.keys(response);

            const resErrors: string[] = [];

            for (const key of keys) {
                response[key].map((err: string) => {
                    resErrors.push(err);
                });
            }

            setErrors(resErrors);
        } else {
            const sliced = username[0] === '@' ? username.slice(1) : username;
            localStorage.setItem('username', sliced);
            window.location.href = window.location.href;
        }
    }

    return (
        <InnerRegister
            closeRegisterWindow = { closeRegisterWindow }
            handleSubmit = { submitData }
            updateState = { updateStateFromInput }
            errors = { errors } />
    );
};

const inputData: Input[] = [
    {
        type: 'text',
        name: HooksNames.username,
        placeholder: 'Логин в Telegram'
    },
    {
        type: 'email',
        name: HooksNames.email,
        placeholder: 'Email'
    },
    {
        type: 'password',
        name: HooksNames.password,
        placeholder: 'Пароль'
    },
    {
        type: 'text',
        name: HooksNames.referral,
        placeholder: 'Telegram вашего пригласителя',
        optional: true
    }
];

const InnerRegister: FC<InnerProps> = ({
    closeRegisterWindow, updateState, handleSubmit, errors
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

            {
                inputData.map(({ type, name, placeholder, optional }) => {
                    const Input = (
                        <input
                            className = 'interactive login-input'
                            type = { type }
                            name = { name }
                            onChange = { updateState }
                            placeholder = { placeholder }
                            key = { name } />
                    )

                    if (optional) {
                        return (
                            <div key = { name }>
                                { Input }
                            </div>
                        )
                    }

                    return Input;
                })
            }

            { errors.length > 0 && errors.map(err => (
                <div className="error" key={err}>{err}</div>
            )) }

            <button
                className = 'interactive login-submit'
                onClick = { handleSubmit }>
            Отправить
            </button>
        </div>
    </div>)
;

export default Register;
