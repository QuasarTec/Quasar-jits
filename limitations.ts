/* eslint-disable flowtype/no-types-missing-file-annotation */
const premiumDomain = 'https://localhost:5000/'; // these are just examples and must be changed in production
const defaultDomain = 'https://localhost:8080/';

const premiumDomainRegex = new RegExp(premiumDomain);

const isDomainPremium = premiumDomainRegex.test(window.location.href);

const isUserPaid = async (): Promise<boolean> => {
    const username = localStorage.getItem('username');

    let isPayed = false;

    if (username) {
        const res = await fetch('https://matrix.easy-stars.ru/bot/users/check-on-payed', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                username
            })
        });

        const json = await res.json();

        isPayed = json.payed;
    }

    return isPayed;
};

const maxPeopleAllowed = 2; // this one will be changed
const timeLimitation = 1000 * 10; // and this too

export { isDomainPremium, maxPeopleAllowed, timeLimitation, isUserPaid };

export { premiumDomain, defaultDomain };
