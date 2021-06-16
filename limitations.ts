const premiumDomain = /localhost:8000/;

const isDomainPremium = () => premiumDomain.test(window.location.href);
const maxPeopleAllowed = 2; // this one will be changed
const timeLimitation = 1000 * 10; // and this too

export { isDomainPremium, maxPeopleAllowed, timeLimitation };
