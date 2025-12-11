import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const shortenAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!window.ethereum) return alert("Please install MetaMask!");

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                // Initialize provider/signer
                // Initialize provider/signer
                const _provider = new ethers.BrowserProvider(window.ethereum);
                const _signer = await _provider.getSigner();
                setProvider(_provider);
                setSigner(_signer);
            }
        } catch (error) {
            console.log("Web3Context: Wallet Check Error", error);
        }
    };

    const switchNetwork = async () => {
        try {
            // Check if we are on the correct network (Hardhat Localhost: 1337 -> 0x539)
            // You might need to change this if testing on Sepolia (0xaa36a7)
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x539') {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x539' }], // 1337 in hex
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        alert("Please add Localhost 8545 (Chain ID 1337) to your MetaMask networks.");
                    } else {
                        throw switchError;
                    }
                }
            }
        } catch (error) {
            console.error("Failed to switch network:", error);
            // Don't block connection, but warn
            alert("Warning: You might be on the wrong network. Please ensure you are connected to Localhost 8545.");
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) return alert("Please install MetaMask!");

            // 1. Ensure correct network
            await switchNetwork();

            setIsLoading(true);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setCurrentAccount(accounts[0]);

            const _provider = new ethers.BrowserProvider(window.ethereum);
            const _signer = await _provider.getSigner();
            setProvider(_provider);
            setSigner(_signer);
            setCurrentAccount(accounts[0]);
            setIsLoading(false);

            console.log("Web3Context: Wallet Check Successful", accounts[0]);
            return accounts[0];
        } catch (error) {
            console.error("Wallet connection error:", error);
            setIsLoading(false);

            // Handle specific MetaMask/Provider errors
            if (error.message && error.message.includes("wallet must has at least one account")) {
                try {
                    // ALERT FOR DEBUGGING
                    alert("Debug: Wallet Empty. Attempting to force Permission Popup...");

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
                    alert("Debug: Popup failed or rejected. Reason: " + permError.message);
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



    useEffect(() => {
        checkIfWalletIsConnected();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setCurrentAccount(accounts[0]);
                // window.location.reload();
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ connectWallet, currentAccount, provider, signer, isLoading, shortenAddress }}>
            {children}
        </Web3Context.Provider>
    );
};
