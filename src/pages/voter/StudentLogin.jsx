import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, UserPlus, LogIn, Loader2, Users } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ADMIN_EMAILS } from '../../utils/adminList';

const StudentLogin = () => {
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
                // BLOCK ADMIN EMAILS from Voter Login
                if (ADMIN_EMAILS.includes(formData.email.toLowerCase())) {
                    showToast("Admins must use the Admin Portal!", "error");
                    setLoading(false);
                    return;
                }

                await login(formData.email, formData.password, 'voter'); // Default type 'voter'
                navigate('/voter');
            } else {
                await signup(formData.email, formData.password, 'voter');
                // Usually signup confirms session or requires verify
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel animate-fade-in">
                <div className="login-header">
                    <div className="icon-circle" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Users size={32} color="#3b82f6" />
                    </div>
                    <h2>{isLogin ? 'Student Login' : 'Student Registration'}</h2>
                    <p>{isLogin ? 'Enter your credentials to vote.' : 'Create an account to participate.'}</p>
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
                    <Link to="/" className="back-link" style={{ marginTop: '1rem', display: 'block' }}>Back to Home</Link>
                </div>
            </div>

            <style>{`
                .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-gradient); padding: 1rem; }
                .login-card { width: 100%; max-width: 400px; padding: 2.5rem; border-radius: 20px; background: white; box-shadow: var(--shadow-xl); text-align: center; }
                
                .icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
                .login-header h2 { margin-bottom: 0.5rem; font-size: 1.5rem; }
                .login-header p { color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem; }

                .auth-form { display: flex; flex-direction: column; gap: 1rem; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 1rem; top: 1rem; color: var(--text-muted); }
                .input-group input { width: 100%; padding: 1rem 1rem 1rem 2.8rem; border-radius: 12px; border: 1px solid var(--border-color); background: #f8fafc; transition: all 0.2s; }
                .input-group input:focus { outline: none; border-color: var(--primary); background: white; }

                .auth-btn { background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
                .auth-btn:hover { background: var(--primary-dark); }
                
                .auth-footer { margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted); }
                .text-link { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; padding: 0; }
                .back-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default StudentLogin;
