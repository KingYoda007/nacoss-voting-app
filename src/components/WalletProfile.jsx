import React, { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, Copy, Check, ChevronDown } from 'lucide-react';

const WalletProfile = ({ address, onDisconnect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const shortenAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="wallet-profile" ref={dropdownRef}>
            <button
                className={`wallet-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="wallet-icon-bg">
                    <Wallet size={18} />
                </div>
                <span className="wallet-addr">{shortenAddress(address)}</span>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div className="wallet-dropdown glass-panel animate-fade-in-quick">
                    <div className="dropdown-header">
                        <span className="label">Connected Wallet</span>
                        <span className="full-addr" title={address}>{address}</span>
                    </div>

                    <div className="dropdown-actions">
                        <button className="action-item" onClick={handleCopy}>
                            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                        </button>

                        <div className="divider"></div>

                        <button className="action-item dangerous" onClick={onDisconnect}>
                            <LogOut size={16} />
                            <span>Disconnect</span>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .wallet-profile { position: relative; }
                
                .wallet-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    background: white;
                    border: 1px solid var(--border-color);
                    padding: 0.5rem 0.8rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-main);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .wallet-trigger:hover, .wallet-trigger.active {
                    border-color: var(--primary);
                    background: #f8faff;
                }

                .wallet-icon-bg {
                    background: rgba(37, 99, 235, 0.1);
                    color: var(--primary);
                    padding: 0.4rem;
                    border-radius: 8px;
                    display: flex;
                }

                .wallet-addr { font-weight: 600; font-size: 0.9rem; font-family: 'Space Mono', monospace; }
                
                .chevron { transition: transform 0.2s; color: var(--text-muted); }
                .chevron.rotate { transform: rotate(180deg); }

                .wallet-dropdown {
                    position: absolute;
                    top: 120%;
                    right: 0;
                    width: 280px;
                    background: white;
                    border-radius: 16px;
                    padding: 1rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                    border: 1px solid var(--border-color);
                    z-index: 100;
                }

                .dropdown-header { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border-color); }
                .dropdown-header .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; }
                .full-addr { font-size: 0.8rem; color: var(--text-main); word-break: break-all; font-family: 'Space Mono', monospace; line-height: 1.4; }

                .dropdown-actions { display: flex; flex-direction: column; gap: 0.3rem; }
                
                .action-item {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    padding: 0.8rem;
                    width: 100%;
                    text-align: left;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: var(--text-main);
                    transition: all 0.2s;
                }
                .action-item:hover { background: #f1f5f9; }
                .action-item.dangerous { color: #ef4444; }
                .action-item.dangerous:hover { background: #fee2e2; }

                .animate-fade-in-quick { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default WalletProfile;
