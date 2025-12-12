import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { login, signup, user } = useAuth();
    const { showToast } = useToast();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/voter');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return showToast("Please fill in all fields", "error");
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password, 'voter');
                navigate('/voter');
            } else {
                await signup(formData.email, formData.password, 'voter');
                // Usually signup confirms session or requires verify
                // Supabase default: if email confirm is off, it logs in.
                // If on, it asks to check email. We assume auto-login or "Check email".
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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

                <div className="auth-card glass-panel animate-fade-in">
                    <div className="auth-header">
                        <h2>{isLogin ? 'Student Login' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Enter your credentials to access the voting booth.' : 'Register to participate in the upcoming elections.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Student Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? (
                                <Loader2 className="spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Register'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button className="text-link" onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Register Here' : 'Login Here'}
                            </button>
                        </p>
                    </div>
                </div>

                <footer className="landing-footer">
                    <p>&copy; {new Date().getFullYear()} NACOSS. All rights reserved.</p>
                </footer>
            </div>

            <style>{`
                .landing-page {
                    min-height: 100vh;
                    background: var(--bg-main);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                .landing-container {
                    width: 100%;
                    max-width: 450px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .landing-header { text-align: center; margin-bottom: 2rem; }
                .landing-logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; box-shadow: var(--shadow-md); border: 2px solid white; }
                .landing-header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-main); }
                .landing-header p { color: var(--text-muted); }

                .auth-card {
                    width: 100%;
                    padding: 2rem;
                    border-radius: 24px;
                    background: white;
                    box-shadow: var(--shadow-xl);
                }
                .auth-header { text-align: center; margin-bottom: 2rem; }
                .auth-header h2 { margin-bottom: 0.5rem; font-size: 1.3rem; }
                .auth-header p { font-size: 0.9rem; color: var(--text-muted); }

                .auth-form { display: flex; flex-direction: column; gap: 1rem; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 1rem; top: 1rem; color: var(--text-muted); }
                .input-group input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 2.8rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    background: #f8fafc;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                .input-group input:focus {
                    background: white;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    outline: none;
                }

                .auth-btn {
                    margin-top: 1rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }
                .auth-btn:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
                .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
                .text-link { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; padding: 0; margin-left: 0.3rem; }
                .text-link:hover { text-decoration: underline; }

                .landing-footer { margin-top: 2rem; color: var(--text-muted); font-size: 0.8rem; opacity: 0.7; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default LandingPage;
