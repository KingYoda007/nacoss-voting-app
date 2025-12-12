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
    const { showToast } = useToast();

    const shortenAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
    };

    const checkOwner = async (providerOrSigner, account) => {
        try {
            if (!providerOrSigner) return;
            // Use read-only provider if signer not available, but prefer signer
            const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingSystemABI.abi, providerOrSigner);
            const owner = await contract.owner();
            setContractOwner(owner);

            const isOwner = owner.toLowerCase() === account.toLowerCase();
            setIsAdmin(isOwner);
            console.log("Admin Check:", isOwner, "(Owner:", owner, "Account:", account, ")");
        } catch (error) {
            console.error("Failed to fetch contract owner:", error);
        }
    };

    const switchNetwork = async () => {
        try {
            const provider = await detectEthereumProvider();
            if (!provider) return false;

            // Check if we are on the correct network (Sepolia: 11155111 -> 0xaa36a7)
            const chainId = await provider.request({ method: 'eth_chainId' });
            if (chainId !== '0xaa36a7') {
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0xaa36a7' }],
                    });
                    return true;
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902 || switchError.code === -32603) {
                        try {
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0xaa36a7',
                                        chainName: 'Sepolia Testnet',
                                        rpcUrls: ['https://rpc.sepolia.org'],
                                        nativeCurrency: {
                                            name: 'SepoliaETH',
                                            symbol: 'ETH',
                                            decimals: 18,
                                        },
                                        blockExplorerUrls: ['https://sepolia.etherscan.io'],
                                    },
                                ],
                            });
                            return true;
                        } catch (addError) {
                            showToast("Failed to add Sepolia network: " + addError.message, "error");
                            return false;
                        }
                    } else {
                        throw switchError;
                    }
                }
            }
            return true;
        } catch (error) {
            console.error("Failed to switch network:", error);
            // Don't block connection, but warn
            showToast("Warning: You might be on the wrong network. Please connect to Sepolia.", "info");
            return false;
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            const provider = await detectEthereumProvider({ silent: true });

            if (!provider) {
                console.log("MetaMask not detected");
                return;
            }

            // Check if explicitly disconnected
            if (localStorage.getItem('walletDisconnected') === 'true') {
                console.log("Wallet explicitly disconnected by user.");
                return;
            }

            const accounts = await provider.request({ method: 'eth_accounts' });

            if (accounts.length) {
                // FORCE network switch before setting state
                const isCorrectNetwork = await switchNetwork();
                if (!isCorrectNetwork) return;

                const account = accounts[0];
                setCurrentAccount(account);

                // Initialize provider/signer
                const _provider = new ethers.BrowserProvider(provider);
                const _signer = await _provider.getSigner();
                setProvider(_provider);
                setSigner(_signer);

                // Check Admin Status
                checkOwner(_provider, account);
            }
        } catch (error) {
            console.log("Web3Context: Wallet Check Error", error);
        }
    };

    const connectWallet = async () => {
        localStorage.removeItem('walletDisconnected'); // Reset flag
        try {
            const provider = await detectEthereumProvider();

            if (!provider) {
                showToast("Please install MetaMask!", "error");
                return;
            }

            // 1. Ensure correct network
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

            setIsLoading(false);

            console.log("Web3Context: Wallet Check Successful", account);
            showToast("Wallet Connected!", "success");
            return account;
        } catch (error) {
            console.error("Wallet connection error:", error);
            setIsLoading(false);

            // Handle specific MetaMask/Provider errors
            if (error.message && error.message.includes("wallet must has at least one account")) {
                try {
                    // ALERT FOR DEBUGGING
                    showToast("Debug: Wallet Empty. Attempting to force Permission Popup...", "info");

                    // FORCE the popup to appear by requesting permissions
                    await window.ethereum.request({
                        method: "wallet_requestPermissions",
                        params: [{ eth_accounts: {} }],
                    });

                    // If successful (user created/selected account), try connecting again
                    const newAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                    setCurrentAccount(newAccounts[0]);
                    setIsLoading(false);
                    return newAccounts[0];
                } catch (permError) {
                    console.error("Permission request failed", permError);
                    showToast("Debug: Popup failed or rejected.", "error");
                    // If they cancelled the popup, then throw the empty wallet error
                    throw new Error("EMPTY_WALLET");
                }
            }

            // Fallback: If generic error or user rejected (sometimes purely UI sync issue), 
            // try forcing the Permissions UI which often wakes up MetaMask.
            if (error.code === -32002 || (error.message && error.message.includes("Already processing"))) {
                throw new Error("MetaMask is pending! Click the extension icon.");
            }

            throw new Error(error.message || "Failed to connect wallet");
        }
    };

    const disconnectWallet = () => {
        setCurrentAccount('');
        setIsAdmin(false);
        setContractOwner('');
        localStorage.setItem('walletDisconnected', 'true'); // Flag to prevent auto-reconnect
        console.log("Wallet Disconnected via App");
        window.location.reload(); // Reload to clear state
    };

    useEffect(() => {
        checkIfWalletIsConnected();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setCurrentAccount(accounts[0]);
                    // Re-check owner on account change
                    // Note: Ideally we re-instantiate provider but simple reload is often safer for sync
                    window.location.reload();
                } else {
                    setCurrentAccount('');
                    setIsAdmin(false);
                }
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ connectWallet, disconnectWallet, currentAccount, provider, signer, isLoading, shortenAddress, isAdmin }}>
            {children}
        </Web3Context.Provider>
    );
};
