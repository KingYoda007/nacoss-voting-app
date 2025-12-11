import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, History, Vote } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';

const VoterLayout = () => {
    const navigate = useNavigate();
    const { currentAccount, connectWallet, shortenAddress } = useContext(Web3Context);

    useEffect(() => {
        if (!currentAccount) {
            // Optional: You could show a toast here "Please connect wallet"
            navigate('/');
        }
    }, [currentAccount, navigate]);

    const handleLogout = () => {
        navigate('/');
    };

    return (
        <div className="voter-layout">
            {/* Top Navigation Bar */}
            <header className="voter-header">
                <div className="header-brand">
                    <img src={logo} alt="NACOSS Logo" className="brand-logo" />
                    <div className="brand-text">
                        <h1>NACOSS Elections</h1>
                        <span>Official Voting Portal</span>
                    </div>
                </div>

                <nav className="voter-nav">
                    <NavLink to="/voter/booth" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Vote size={18} />
                        <span>Vote</span>
                    </NavLink>
                    <NavLink to="/voter/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <History size={18} />
                        <span>My History</span>
                    </NavLink>
                </nav>

                <div className="header-actions">
                    {currentAccount ? (
                        <div className="wallet-badge">
                            <Wallet size={16} />
                            <span>{shortenAddress(currentAccount)}</span>
                        </div>
                    ) : (
                        <button onClick={connectWallet} className="connect-btn-small">Connect Wallet</button>
                    )}
                    <button onClick={handleLogout} className="logout-icon-btn" title="Exit">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="voter-content">
                <div className="voter-container">
                    <Outlet />
                </div>
            </main>

            <footer className="voter-footer">
                <p>&copy; 2024 NACOSS Voting System. Secured by Blockchain.</p>
            </footer>
        </div>
    );
};

export default VoterLayout;
