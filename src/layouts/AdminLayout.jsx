import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Vote, Users, UserPlus, LogOut, FileText, ShieldAlert, Wallet } from 'lucide-react';
import { Web3Context } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';
import ErrorBoundary from '../components/ErrorBoundary';
import WalletProfile from '../components/WalletProfile';

const AdminLayout = () => {
    const navigate = useNavigate();
    const { connectWallet, currentAccount, isAdmin, isLoading, disconnectWallet, networkName } = useContext(Web3Context);
    const { logout } = useAuth();

    const handleLogout = async () => {
        disconnectWallet();       // 1. Clear Wallet
        await logout();           // 2. Clear Supabase Session
        navigate('/admin/login'); // 3. Redirect to Admin Login
    };

    if (isLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff', color: 'var(--primary)' }}>
                <h3>Verifying Admin Status...</h3>
            </div>
        );
    }

    if (!isAdmin && currentAccount) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8faff', gap: '1rem' }}>
                <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Access Denied</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        The connected wallet <strong>{currentAccount.slice(0, 6)}...</strong> is not the contract owner.
                    </p>
                    <button className="btn-primary" onClick={handleLogout}>Go to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar glass">
                <div className="sidebar-header">
                    <img src={logo} alt="NACOSS Logo" className="sidebar-logo" />
                    <div className="sidebar-title">
                        <h3>NACOSS</h3>
                        <span>Elections Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin/overview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Overview">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </NavLink>
                    <NavLink to="/admin/elections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Elections">
                        <Vote size={20} />
                        <span>Elections</span>
                    </NavLink>
                    <NavLink to="/admin/candidates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Candidates">
                        <UserPlus size={20} />
                        <span>Candidates</span>
                    </NavLink>
                    <NavLink to="/admin/voters" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Voters">
                        <Users size={20} />
                        <span>Voters</span>
                    </NavLink>
                    <NavLink to="/admin/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Results">
                        <FileText size={20} />
                        <span>Results</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar glass" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
                    <h2>Admin Portal</h2>
                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {networkName && networkName !== 'Unknown' && (
                            <div className="network-pill" style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-color)',
                                padding: '0.3rem 0.8rem', borderRadius: '20px',
                                fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)'
                            }}>
                                <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></span>
                                {networkName}
                            </div>
                        )}

                        <div className="user-profile">
                            {currentAccount ? (
                                <WalletProfile
                                    address={currentAccount}
                                    onDisconnect={handleLogout}
                                />
                            ) : (
                                <button className="btn-primary" onClick={connectWallet} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    <Wallet size={16} /> Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </header>
                <div className="content-area">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
