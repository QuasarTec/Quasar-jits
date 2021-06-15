const premiumDomain = /localhost:8000/;

const isDomainPremium = () => premiumDomain.test(window.location.href);
const maxPeopleAllowed = 2; // we'll change that
const timeLimitation = 1000 * 20; // and this too

export { isDomainPremium, maxPeopleAllowed, timeLimitation };
