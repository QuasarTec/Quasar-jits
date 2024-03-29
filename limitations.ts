/* eslint-disable flowtype/no-types-missing-file-annotation */
const premiumDomain = 'https://qtconnect.ru/';
const defaultDomain = 'https://qtconnect.ru/';

const premiumDomainRegex = new RegExp(premiumDomain);

const isDomainPremium = premiumDomainRegex.test(window.location.href);

const isUserPaid = async (): Promise<boolean> => {

	return true;

    /* const username = localStorage.getItem('username');

    let isPayed = false;

    if (username) {
        const res = await fetch('https://bot.quasaria.ru/bot/users/check-on-payed', {
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

    return isPayed; */
};

const maxPeopleAllowed = 10000;
const timeLimitation = 6000000 * 50;
const timeTillNotification = 6000000 * 40;

export { isDomainPremium, maxPeopleAllowed, timeLimitation, isUserPaid, timeTillNotification };

export { premiumDomain, defaultDomain };
