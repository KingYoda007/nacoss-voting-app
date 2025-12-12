import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Users, Lock, ChevronRight } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // If already logged in, show "Go to Dashboard" instead of login options
    // But we need to know WHICH dashboard. For now, assuming standard flow.

    return (
        <div className="landing-page animate-fade-in">
            <header className="navbar glass-panel">
                <div className="brand">
                    <img src={logo} alt="NACOSS" className="nav-logo" />
                    <span>NACOSS Voting</span>
                </div>
                {user ? (
                    <Link to="/voter" className="btn-primary-sm">Go to Dashboard</Link>
                ) : (
                    <div style={{ width: '20px' }}></div>
                )}
            </header>

            <main className="hero-section">
                <div className="hero-content">
                    <h1>Secure Digital Democracy</h1>
                    <p className="hero-subtitle">The official blockchain-powered voting platform for the National Association of Computer Science Students.</p>

                    <div className="role-cards">
                        {/* Voter Card */}
                        <div className="role-card glass-panel hover-scale" onClick={() => navigate('/voter/login')}>
                            <div className="icon-box blue">
                                <Users size={32} />
                            </div>
                            <h3>Student Voter</h3>
                            <p>Cast your vote securely using your student credentials.</p>
                            <span className="card-link">Login to Vote <ChevronRight size={16} /></span>
                        </div>

                        {/* Candidate Card */}
                        <div className="role-card glass-panel hover-scale" onClick={() => navigate('/candidate/login')}>
                            <div className="icon-box green">
                                <User size={32} />
                            </div>
                            <h3>Candidate</h3>
                            <p>Manage your campaign, manifesto, and view live results.</p>
                            <span className="card-link">Candidate Portal <ChevronRight size={16} /></span>
                        </div>

                        {/* Admin Card Removed - Accessible via /admin/login */}
                    </div>
                </div>
            </main>

            <footer className="simple-footer">
                <p>&copy; {new Date().getFullYear()} NACOSS FUPRE Chapter. Secured by Ethereum Blockchain.</p>
            </footer>

            <style>{`
                .landing-page { cursor: default; min-height: 100vh; background: var(--bg-gradient); display: flex; flex-direction: column; }
                
                .navbar { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; margin: 1rem 2rem; border-radius: 16px; }
                .brand { display: flex; align-items: center; gap: 0.8rem; font-weight: 700; font-size: 1.1rem; color: var(--text-main); }
                .nav-logo { width: 40px; height: 40px; border-radius: 50%; }
                .btn-primary-sm { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; }

                .hero-section { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .hero-content { max-width: 1000px; text-align: center; }
                .hero-content h1 { font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .hero-subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 4rem; max-width: 600px; margin-left: auto; margin-right: auto; }

                .role-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
                .role-card { padding: 2rem; border-radius: 20px; text-align: left; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.5); }
                .role-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.15); }
                
                .icon-box { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
                .blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

                .role-card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-main); }
                .role-card p { width: 100%; color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
                
                .card-link { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 600; font-size: 0.9rem; }

                .simple-footer { text-align: center; padding: 2rem; color: var(--text-light); font-size: 0.9rem; }
            `}</style>
        </div>
    );
};

export default LandingPage;
