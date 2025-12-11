import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../context/Web3Context';
import VotingSystemABI from '../artifacts/contracts/VotingSystem.sol/VotingSystem.json';

// IMPORTANT: Update this address after deployment
// For local hardhat node, it is usually deterministic if you use first account
// But better to read from config or env.
// Example placeholder address
import { CONTRACT_ADDRESS } from '../utils/contract-config';

// Address is now imported from config
const contractAddress = CONTRACT_ADDRESS;

export const useContract = () => {
    const { provider, signer } = useContext(Web3Context);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        if (signer) {
            const votingContract = new ethers.Contract(contractAddress, VotingSystemABI.abi, signer);
            setContract(votingContract);
        } else if (provider) {
            // Read-only
            const votingContract = new ethers.Contract(contractAddress, VotingSystemABI.abi, provider);
            setContract(votingContract);
        }
    }, [provider, signer]);

    return { contract };
};
