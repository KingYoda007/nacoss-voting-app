import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { CONTRACT_ADDRESS } from '../utils/contract-config';
import VotingSystemABI from '../artifacts/contracts/VotingSystem.sol/VotingSystem.json';
import { useToast } from './ToastContext';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [contractOwner, setContractOwner] = useState('');
    const [networkName, setNetworkName] = useState('Unknown');
    const { showToast } = useToast();

    // 1. Helper: Shorten Address
    const shortenAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
    };

    // 2. Helper: Switch Network (Sepolia)
    const switchNetwork = async () => {
        const targetChainId = "0xaa36a7"; // Sepolia (11155111) hex
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetChainId }],
            });
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: targetChainId,
                                chainName: "Sepolia Test Network",
                                rpcUrls: ["https://1rpc.io/sepolia", "https://rpc.sepolia.org"],
                                nativeCurrency: {
                                    name: "Sepolia ETH",
                                    symbol: "ETH",
                                    decimals: 18,
                                },
                                blockExplorerUrls: ["https://sepolia.etherscan.io"],
                            },
                        ],
                    });
                    return true;
                } catch (addError) {
                    console.error("Failed to add network:", addError);
                    showToast("Failed to add Sepolia network.", "error");
                    return false;
                }
            }
            console.error("Failed to switch network:", switchError);
            showToast("Failed to switch to Sepolia.", "error");
            return false;
        }
    };

    // 3. Helper: Check Owner (Admin Status)
    const checkOwner = async (prov, account, retryCount = 0) => {
        try {
            const signer = await prov.getSigner();
            const votingContract = new ethers.Contract(CONTRACT_ADDRESS, VotingSystemABI.abi, signer);

            console.log(`Checking owner for: ${account}`);

            const owner = await votingContract.owner().catch(err => {
                console.warn("Contract owner() call failed/reverted:", err);
                return null;
            });

            if (owner) {
                setContractOwner(owner);
                if (owner.toLowerCase() === account.toLowerCase()) {
                    setIsAdmin(true);
                    console.log("Admin Privileges Granted.");
                } else {
                    setIsAdmin(false);
                    console.log("User is standard voter.");
                }
            } else {
                console.log("Could not retrieve owner. Contract might not be deployed or ABI mismatch.");
                if (retryCount < 3) {
                    setTimeout(() => checkOwner(prov, account, retryCount + 1), 1000);
                }
            }
        } catch (error) {
            console.error("Error checking owner:", error);
        }
    };

    // 4. Helper: Check Network Name
    const checkNetwork = async (prov) => {
        if (!prov) return;
        try {
            const network = await prov.getNetwork();
            const chainId = network.chainId; // bigint

            if (chainId === 11155111n) setNetworkName("Sepolia");
            else if (chainId === 1n) setNetworkName("Mainnet");
            else if (chainId === 1337n) setNetworkName("Ganache (Local)");
            else if (chainId === 31337n) setNetworkName("Hardhat (Local)");
            else setNetworkName("Unknown Network");

        } catch (err) {
            console.error("Network check failed:", err);
            setNetworkName("Unknown");
        }
    };

    // 5. Main: Check if Wallet Connected
    const checkIfWalletIsConnected = async () => {
        try {
            const provider = await detectEthereumProvider({ silent: true });

            if (!provider) {
                console.log("MetaMask not detected");
                return;
            }

            if (localStorage.getItem('walletDisconnected') === 'true') {
                console.log("Wallet explicitly disconnected by user.");
                return;
            }

            const accounts = await provider.request({ method: 'eth_accounts' });

            if (accounts.length) {
                const isCorrectNetwork = await switchNetwork();
                if (!isCorrectNetwork) return;

                const account = accounts[0];
                setCurrentAccount(account);

                const _provider = new ethers.BrowserProvider(provider);
                const _signer = await _provider.getSigner();
                setProvider(_provider);
                setSigner(_signer);

                checkOwner(_provider, account);
                checkNetwork(_provider);
            }
        } catch (error) {
            console.log("Web3Context: Wallet Check Error", error);
        }
    };

    // 6. Main: Connect Wallet
    const connectWallet = async () => {
        localStorage.removeItem('walletDisconnected');
        try {
            const provider = await detectEthereumProvider();

            if (!provider) {
                showToast("Please install MetaMask!", "error");
                return;
            }

            const isCorrectNetwork = await switchNetwork();
            if (!isCorrectNetwork) return;

            setIsLoading(true);
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            const account = accounts[0];
            setCurrentAccount(account);

            const _provider = new ethers.BrowserProvider(provider);
            const _signer = await _provider.getSigner();
            setProvider(_provider);
            setSigner(_signer);

            await checkOwner(_provider, account);
            await checkNetwork(_provider);

            setIsLoading(false);
            showToast("Wallet Connected!", "success");
            return account;
        } catch (error) {
            console.error("Wallet connection error:", error);
            setIsLoading(false);
            if (error.message && error.message.includes("wallet must has at least one account")) {
                try {
                    showToast("Debug: Wallet Empty. Attempting to force Permission Popup...", "info");
                    await window.ethereum.request({
                        method: "wallet_requestPermissions",
                        params: [{ eth_accounts: {} }],
                    });
                    const newAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                    setCurrentAccount(newAccounts[0]);
                    setIsLoading(false);
                    return newAccounts[0];
                } catch (permError) {
                    console.error("Permission request failed", permError);
                    showToast("Debug: Popup failed or rejected.", "error");
                    throw new Error("EMPTY_WALLET");
                }
            }

            if (error.code === -32002 || (error.message && error.message.includes("Already processing"))) {
                throw new Error("MetaMask is pending! Click the extension icon.");
            }

            throw new Error(error.message || "Failed to connect wallet");
        }
    };

    // 7. Main: Disconnect
    const disconnectWallet = () => {
        setCurrentAccount('');
        setIsAdmin(false);
        setContractOwner('');
        setNetworkName('Unknown');
        localStorage.setItem('walletDisconnected', 'true');
        console.log("Wallet Disconnected via App");
        window.location.reload();
    };

    // 8. Lifecycle
    useEffect(() => {
        checkIfWalletIsConnected();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (!accounts || accounts.length === 0) {
                    disconnectWallet();
                } else {
                    // Optional: reload or update context
                    window.location.reload();
                }
            });
            window.ethereum.on('chainChanged', () => window.location.reload());
        }

        return () => {
            // Cleanup listeners if needed (ethers.js handles some, but raw ethereum events persist)
        };
    }, []);

    return (
        <Web3Context.Provider value={{ connectWallet, disconnectWallet, currentAccount, provider, signer, isLoading, shortenAddress, isAdmin, networkName }}>
            {children}
        </Web3Context.Provider>
    );
};
