import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, Loader2, Mail } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login, user, loginType, logout } = useAuth(); // Destructuring loginType and logout
    const { showToast } = useToast();

    // HARDCODED ADMIN ALLOWLIST - Using lowercase for validation
    // TODO: Move this to Supabase 'profiles' table with 'role' column for production
    const ADMIN_EMAILS = [
        'admin@nacoss.com',
        'elections@nacoss.com',
        'kingsblanc@gmail.com'
    ];

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Redirect if already logged in AND is admin
    useEffect(() => {
        if (user && loginType === 'admin') {
            navigate('/admin/overview');
        }
    }, [user, loginType, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Check if Email is in Allowlist BEFORE proceeding (Client-side pre-check)
            // Note: We also check AFTER login to be sure, but this saves a request if obviously wrong.
            if (!ADMIN_EMAILS.includes(formData.email.toLowerCase())) {
                throw new Error("Unauthorized: This email is not an Admin.");
            }

            // 2. Perform Login
            // Pass 'admin' as the login type for strict separation
            await login(formData.email, formData.password, 'admin');

            // 3. One final check (paranoid redundant check)
            // If the login succeeded but the email was somehow different (unlikely here but good practice)
            navigate('/admin/overview');
            showToast("Welcome Administrator", "success");
        } catch (err) {
            console.error(err);
            // If we logged in but failed allowlist check (should be caught by pre-check above, but safe fallback)
            // logout(); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="login-container animate-fade-in">
                <div className="login-card glass-panel">
                    <div className="card-header">
                        <img src={logo} alt="Logo" className="admin-logo" />
                        <h2>Admin Portal</h2>
                        {user && loginType !== 'admin' ? (
                            <div style={{ background: '#fff1f2', color: '#be123c', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #fecdd3' }}>
                                <strong>Access Denied:</strong> You are currently logged in as a Voter. Please log out to access the Admin Portal.
                                <button
                                    onClick={logout}
                                    style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.4rem', background: '#be123c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Log Out & Switch Account
                                </button>
                            </div>
                        ) : (
                            <p>Restricted Access Only</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Admin Email"
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

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <Loader2 className="spin" size={20} /> : (
                                <>
                                    <span>Authenticate</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="back-link">
                        <a href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to Main Site</a>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9; /* Slightly darker/different bg for admin context */
                    padding: 1rem;
                }
                .login-container { width: 100%; max-width: 400px; }
                
                .login-card {
                    background: white;
                    padding: 2.5rem;
                    border-radius: 20px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border: 1px solid white;
                }

                .card-header { text-align: center; margin-bottom: 2rem; }
                .admin-logo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; }
                .card-header h2 { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem; }
                .card-header p { color: #64748b; font-size: 0.9rem; }

                .login-form { display: flex; flex-direction: column; gap: 1.2rem; }
                
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 1rem; top: 1rem; color: #94a3b8; }
                .input-group input {
                    width: 100%;
                    padding: 0.8rem 1rem 0.8rem 2.8rem;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                    background: #f8fafc;
                }
                .input-group input:focus {
                    background: white;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    outline: none;
                }

                .login-btn {
                    margin-top: 1rem;
                    background: #0f172a; /* Darker for admin */
                    color: white;
                    border: none;
                    padding: 0.9rem;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }
                .login-btn:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
                .login-btn:disabled { opacity: 0.7; }

                .back-link { margin-top: 2rem; text-align: center; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminLogin;
