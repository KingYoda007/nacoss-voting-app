import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';

const CandidateLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="admin-layout"> {/* Reusing Admin Layout styles for consistency */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="NACOSS" className="logo" />
                    <h3>Candidate Portal</h3>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/candidate/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="bc">Candidate Panel</div>
                    <div className="user-profile">
                        <div className="avatar">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};

export default CandidateLayout;
