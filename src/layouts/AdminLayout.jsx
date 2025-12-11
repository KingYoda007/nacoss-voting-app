import React, { useContext } from 'react'; // Added useContext
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Vote, Users, UserPlus, LogOut, FileText } from 'lucide-react';
import { Web3Context } from '../context/Web3Context'; // Import Context
import logo from '../assets/logo.jpg';

const AdminLayout = () => {
    const navigate = useNavigate();
    const { connectWallet, currentAccount } = useContext(Web3Context); // Get context

    const handleLogout = () => {
        // Clear session data if any
        localStorage.removeItem('nacoss_receipts'); // example cleanup
        navigate('/');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
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
                <header className="top-bar">
                    <h2>Admin Portal</h2>
                    <div className="user-profile">
                        {currentAccount ? (
                            <>
                                <div className="avatar">A</div>
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Administrator</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <button className="btn-primary" onClick={connectWallet} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
