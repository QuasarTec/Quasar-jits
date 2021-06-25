/* eslint-disable flowtype/no-types-missing-file-annotation */
const stringify = (data: any) => {
    const result = [];

    for (const prop in data) {
        if (data.hasOwnProperty(prop)) {
            result.push(`${encodeURIComponent(prop)}=${encodeURIComponent(data[prop])}`);
        }
    }

    return result.join('&');
};

export default stringify;
