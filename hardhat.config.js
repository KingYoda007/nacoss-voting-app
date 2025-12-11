require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.24",
    paths: {
        artifacts: "./src/artifacts", // Important for frontend
    },
    networks: {
        hardhat: {
            chainId: 1337
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111
        },
        // Add other networks here (e.g. Lisk, Base)
    }
};
