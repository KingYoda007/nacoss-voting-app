import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, History, Vote, BarChart2, User } from 'lucide-react'; // Added User
import logo from '../assets/logo.jpg';
import { useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import WalletProfile from '../components/WalletProfile';

const VoterLayout = () => {
    const navigate = useNavigate();
    const { currentAccount, connectWallet, disconnectWallet, shortenAddress, networkName } = useContext(Web3Context);
    const { logout, user } = useAuth(); // Destructure user

    // ----------------------------------------------------------------
    // AUTOMATIC WALLET LINKING
    // ----------------------------------------------------------------
    useEffect(() => {
        const linkWallet = async () => {
            if (user && currentAccount) {
                try {
                    // Update the user's profile with the connected wallet address
                    const { error } = await supabase
                        .from('profiles')
                        .update({ wallet_address: currentAccount })
                        .eq('id', user.id);

                    if (error) {
                        // If unique violation (error code 23505), it means wallet is taken
                        if (error.code === '23505') {
                            console.warn("Wallet linked to another account.");
                        } else {
                            console.error("Error linking wallet:", error);
                        }
                    } else {
                        console.log("Wallet linked to profile:", currentAccount);
                    }
                } catch (err) {
                    console.error("Link wallet catch:", err);
                }
            }
        };

        linkWallet();
    }, [user, currentAccount]);
    // ----------------------------------------------------------------

    // Removed wallet-check useEffect to allow Email auth persistence without wallet

    const handleLogout = async () => {
        disconnectWallet(); // Optional: Clear wallet state
        await logout(); // Clear Auth session
        navigate('/');
    };

    return (
        <div className="voter-layout">
            <style>{`
                .network-pill {
                    display: flex; align-items: center; gap: 6px;
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    padding: 0.3rem 0.8rem; border-radius: 20px;
                    font-size: 0.75rem; font-weight: 600; color: #cbd5e1;
                }
                .dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
            `}</style>
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
                    {/* Network Status */}
                    {networkName && networkName !== 'Unknown' && (
                        <div className="network-pill">
                            <span className="dot"></span>
                            {networkName}
                        </div>
                    )}

                    {/* Wallet Connection */}
                    {currentAccount ? (
                        <WalletProfile
                            address={currentAccount}
                            onDisconnect={disconnectWallet}
                        />
                    ) : (
                        <button onClick={connectWallet} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Wallet size={16} /> Connect Wallet
                        </button>
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
