import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, History, Vote, BarChart2, User } from 'lucide-react'; // Added User
import logo from '../assets/logo.jpg';
import { useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import WalletProfile from '../components/WalletProfile';

const VoterLayout = () => {
    const navigate = useNavigate();
    const { currentAccount, connectWallet, disconnectWallet, shortenAddress } = useContext(Web3Context);
    const { logout } = useAuth();

    // Removed wallet-check useEffect to allow Email auth persistence without wallet

    const handleLogout = async () => {
        disconnectWallet(); // Optional: Clear wallet state
        await logout(); // Clear Auth session
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
                    <NavLink to="/voter/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <BarChart2 size={18} />
                        <span>Results</span>
                    </NavLink>
                    <NavLink to="/voter/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <History size={18} />
                        <span>My History</span>
                    </NavLink>
                    <NavLink to="/voter/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <User size={18} />
                        <span>Profile</span>
                    </NavLink>
                </nav>

                <div className="header-actions">
                    {/* Wallet Connection */}
                    {currentAccount ? (
                        <WalletProfile
                            address={currentAccount}
                            onDisconnect={disconnectWallet}
                        />
                    ) : (
                        <button onClick={connectWallet} className="connect-btn-small">Connect Wallet</button>
                    )}

                    {/* Divider */}
                    <div style={{ width: '1px', background: 'var(--border-color)', height: '24px', margin: '0 0.5rem' }}></div>

                    {/* Auth Logout - Distinct styling */}
                    <button onClick={async () => { await logout(); navigate('/'); }} className="icon-btn" title="Sign Out">
                        <LogOut size={18} color="var(--danger)" />
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
