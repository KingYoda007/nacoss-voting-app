export const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
}

export const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp) * 1000).toLocaleString();
}

export const parseError = (error) => {
    if (!error) return "Unknown Error";
    if (error.reason) return error.reason;
    if (error.message) return error.message;
    return "Transaction Failed";
}
