import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, GraduationCap, ChevronRight, Lock } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { Web3Context } from '../context/Web3Context';

const LandingPage = () => {
    const navigate = useNavigate();
    const { connectWallet, currentAccount, isLoading } = useContext(Web3Context);
    const { showToast } = useToast();
    const [showHelp, setShowHelp] = useState(false);

    const handleAdminLogin = () => {
        console.log("Navigating to Admin");
        navigate('/admin');
    };

    const handleVoterLogin = async (e) => {
        e?.stopPropagation();
        if (currentAccount) {
            navigate('/voter');
        } else {
            try {
                const connectedAccount = await connectWallet();
                if (connectedAccount) {
                    navigate('/voter');
                }
            } catch (error) {
                console.error("Connection failed:", error);
                if (error.message === "EMPTY_WALLET") {
                    setShowHelp(true);
                } else {
                    showToast("Failed to connect: " + error.message, "error");
                }
            }
        }
    };

    return (
        <div className="landing-page">
            <div className="landing-container">
                <header className="landing-header">
                    <img src={logo} alt="NACOSS Logo" className="landing-logo" />
                    <h1>NACOSS General Elections</h1>
                    <p>Secure Voting Portal</p>
                </header>

                <div className="portal-grid">
                    {/* Admin Portal Card */}
                    <div className="portal-card admin" onClick={handleAdminLogin}>
                        <div className="card-icon-wrapper">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="portal-title">Admin Portal</h2>
                        <p className="portal-desc">
                            Restricted access for election commissioners to manage candidates,
                            voters, and system settings.
                        </p>
                        <button className="portal-btn">
                            Access Dashboard
                        </button>
                    </div>

                    {/* Student Portal Card */}
                    <div className="portal-card student" onClick={handleVoterLogin}>
                        <div className="card-icon-wrapper">
                            <GraduationCap size={32} />
                        </div>
                        <h2 className="portal-title">Student Portal</h2>
                        <p className="portal-desc">
                            Secure blockchain-based voting for eligible students.
                            Connect your wallet to cast your vote.
                        </p>
                        <button className="portal-btn" disabled={isLoading}>
                            {isLoading ? 'Connecting...' : (currentAccount ? 'Enter Voting Booth' : 'Connect Wallet')}
                        </button>
                    </div>
                </div>

                <footer className="landing-footer">
                    <p>&copy; {new Date().getFullYear()} NACOSS. All rights reserved. • Powered by Ethereum Blockchain</p>
                </footer>

                {/* Help Modal for Empty Wallet */}
                {showHelp && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '16px',
                            maxWidth: '500px', textAlign: 'center', position: 'relative'
                        }}>
                            <button onClick={() => setShowHelp(false)} style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'transparent', border: 'none', fontSize: '1.5rem',
                                cursor: 'pointer', color: '#64748b'
                            }}>
                                ×
                            </button>
                            <h2 style={{ color: '#ef4444', marginTop: 0 }}>Wallet Setup Required</h2>

                            <p style={{ color: '#334155', lineHeight: '1.6' }}>
                                <strong>Your MetaMask wallet has no accounts.</strong><br />
                                To fix this, you must create one in the extension.
                            </p>

                            <ol style={{ textAlign: 'left', color: '#475569', margin: '1.5rem 0' }}>
                                <li>Click the <strong>Fox Icon</strong> (MetaMask) in your browser toolbar.</li>
                                <li>Click <strong>"Create Account"</strong>.</li>
                                <li>Once an account exists (e.g., "Account 1"), click <strong>Try Again</strong> below.</li>
                            </ol>

                            <button onClick={async () => {
                                try {
                                    // Force MetaMask to show the "Select Account" screen
                                    await window.ethereum.request({
                                        method: "wallet_requestPermissions",
                                        params: [{ eth_accounts: {} }]
                                    });
                                    setShowHelp(false);
                                    // If permission granted, try full connection
                                    const account = await connectWallet();
                                    if (account) navigate('/voter');
                                } catch (err) {
                                    console.error(err);
                                    // Show the EXACT error from MetaMask
                                    showToast("MetaMask Error: " + (err.message || err), "error");
                                }
                            }} style={{
                                background: '#2563eb', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', borderRadius: '8px',
                                fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem', width: '100%'
                            }}>
                                I've Created an Account - Connect Now
                            </button>

                            <button onClick={() => window.location.reload()} style={{
                                background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1',
                                padding: '0.5rem 1rem', borderRadius: '8px',
                                fontSize: '0.9rem', cursor: 'pointer', width: '100%'
                            }}>
                                Reload Page (Try this if stuck)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
