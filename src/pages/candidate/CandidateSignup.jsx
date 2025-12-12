import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';

const CandidateSignup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signup, loading } = useAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const { error } = await signup(email, password, 'candidate');
            // If signup is successful and doesn't throw, usually we redirect or show success.
            // Supabase auto-login behavior depends on config, but usually safe to redirect.
            if (!error) navigate('/candidate/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel animate-fade-in">
                <div className="login-header">
                    <div className="icon-circle" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <UserPlus size={32} color="#10B981" />
                    </div>
                    <h2>Candidate Registration</h2>
                    <p>Claim your profile and start campaigning.</p>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Must match the email added by Admin"
                        />
                    </div>

                    <div className="form-group">
                        <label>Create Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="login-footer">
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Already have an account? <Link to="/candidate/login" style={{ color: 'var(--primary)' }}>Log In</Link>
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
                .icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
                .login-header h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--text-main); }
                .login-header p { color: var(--text-muted); font-size: 0.95rem; }

                .form-group { text-align: left; margin-bottom: 1.2rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
                .form-group input { width: 100%; padding: 0.8rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.8); transition: all 0.2s; }
                .form-group input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

                .full-width { width: 100%; padding: 0.9rem; margin-top: 1rem; }
                
                .login-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; color: var(--text-muted); }
                .back-link { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
                .back-link:hover { color: var(--primary); }
            `}</style>
        </div>
    );
};

export default CandidateSignup;
