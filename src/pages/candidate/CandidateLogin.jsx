import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, ArrowLeft } from 'lucide-react';

const CandidateLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(''); // Track error to show button
    const { login, resendConfirmation, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await login(email, password, 'candidate'); // Pass 'candidate' type
            navigate('/candidate/dashboard');
        } catch (error) {
            console.error(error);
            // Check if error is 'Email not confirmed'
            if (error.message && error.message.includes('confirmed')) {
                setErrorMsg('email_unconfirmed');
            }
        }
    };

    const handleResend = async () => {
        if (!email) return;
        await resendConfirmation(email);
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel animate-fade-in">
                <div className="login-header">
                    <div className="icon-circle">
                        <UserCheck size={32} color="var(--primary)" />
                    </div>
                    <h2>Candidate Portal</h2>
                    <p>Manage your campaign and view stats.</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="candidate@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>

                    {/* Resend Logic - Only show if specific error occurred */}
                    {errorMsg === 'email_unconfirmed' && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Email not confirmed?
                                <button
                                    type="button"
                                    className="text-link"
                                    style={{ marginLeft: '5px', color: 'var(--primary)' }}
                                    onClick={handleResend}
                                >
                                    Resend Link
                                </button>
                            </p>
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        First time here? <Link to="/candidate/signup" style={{ color: 'var(--primary)', fontWeight: 500 }}>Claim Profile</Link>
                    </p>
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>

            <style>{`
                .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-gradient); padding: 1rem; }
                .login-card { width: 100%; max-width: 400px; padding: 2.5rem; border-radius: 20px; text-align: center; }
                
                .login-header { margin-bottom: 2rem; }
                .icon-circle { width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
                .login-header h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--text-main); }
                .login-header p { color: var(--text-muted); font-size: 0.95rem; }

                .form-group { text-align: left; margin-bottom: 1.2rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
                .form-group input { width: 100%; padding: 0.8rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.8); transition: all 0.2s; }
                .form-group input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

                .full-width { width: 100%; padding: 0.9rem; margin-top: 1rem; }
                
                .login-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
                .back-link { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
                .back-link:hover { color: var(--primary); }
            `}</style>
        </div>
    );
};

export default CandidateLogin;
