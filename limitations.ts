/* eslint-disable flowtype/no-types-missing-file-annotation */
const premiumDomain = 'https://vip.qtconnect.ru/';
const defaultDomain = 'https://qtconnect.ru/';

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

const maxPeopleAllowed = 110;
const timeLimitation = 60000 * 50;
const timeTillNotification = 60000 * 40;

export { isDomainPremium, maxPeopleAllowed, timeLimitation, isUserPaid, timeTillNotification };

export { premiumDomain, defaultDomain };
