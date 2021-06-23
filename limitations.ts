const premiumDomain = 'http://localhost:5000/'; // these are just examples and must be changed in productionplo
const defaultDomain = 'http://localhost:8080/';

const premiumDomainRegex = new RegExp(premiumDomain);

const isDomainPremium = () => premiumDomainRegex.test(window.location.href);
const maxPeopleAllowed = 2; // this one will be changed
const timeLimitation = 1000 * 10; // and this too

export { isDomainPremium, maxPeopleAllowed, timeLimitation };

export { premiumDomain, defaultDomain };
