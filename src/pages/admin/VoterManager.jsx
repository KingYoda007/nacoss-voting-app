import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserCheck, Upload, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { ethers } from 'ethers';

const VoterManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('single');
    const [voterAddress, setVoterAddress] = useState('');
    const [voters, setVoters] = useState([]);

    useEffect(() => {
        fetchVoters();
    }, []);

    const fetchVoters = async () => {
        try {
            // Select voters and check if they have any votes
            const { data, error } = await supabase
                .from('voters')
                .select('*, votes(count)')
                .order('registered_at', { ascending: false });

            if (error) throw error;

            const votersWithStatus = data.map(v => ({
                ...v,
                hasVoted: v.votes && v.votes[0] && v.votes[0].count > 0
            }));

            setVoters(votersWithStatus || []);
        } catch (err) {
            console.error("Error fetching voters:", err);
        }
    };

    const handleRegisterSingle = async () => {
        if (!ethers.isAddress(voterAddress)) return showToast("Invalid Wallet Address", "error");
        try {
            const tx = await contract.registerVoters([voterAddress]);
            await tx.wait();

            const { error } = await supabase.from('voters').insert([{ wallet_address: voterAddress }]);
            if (error && error.code !== '23505') console.error("Supabase Error:", error);

            showToast("Voter Registered Successfully!", "success");
            setVoterAddress('');
            fetchVoters();
        } catch (err) {
            console.error(err);
            showToast("Error registering: " + (err.reason || err.message), "error");
        }
    };

    return (
        <div className="content-area">
            <div className="page-header">
                <div className="page-title">
                    <h2>Voter Registry</h2>
                    <p>Control who is eligible to vote in the elections.</p>
                </div>
            </div>

            <div className="voter-grid">
                {/* Registration Card */}
                <div className="registration-card glass-panel">
                    <div className="tab-header">
                        <button
                            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                            onClick={() => setActiveTab('single')}
                        >
                            <UserCheck size={18} /> Individual Registration
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bulk')}
                        >
                            <Upload size={18} /> Bulk Registration
                        </button>
                    </div>

                    {activeTab === 'single' ? (
                        <div className="form-content animate-fade-in">
                            <label>Voter Wallet Address</label>
                            <div className="input-group">
                                <input
                                    placeholder="0x..."
                                    value={voterAddress}
                                    onChange={e => setVoterAddress(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleRegisterSingle}>
                                    Register
                                </button>
                            </div>
                            <p className="helper-text">Ensure the address is a valid Ethereum wallet address.</p>
                        </div>
                    ) : (
                        <div className="bulk-content animate-fade-in">
                            <label>Bulk Upload (CSV / Comma Separated)</label>
                            <textarea placeholder="0x123..., 0x456..., 0x789..." style={{ fontFamily: 'monospace' }}></textarea>
                            <button className="btn-primary" disabled style={{ marginTop: '1rem', opacity: 0.5, width: '100%' }}>
                                Process Batch Upload
                            </button>
                            <p className="helper-text">Coming soon: Upload CSV files directly.</p>
                        </div>
                    )}
                </div>

                {/* Voter List */}
                <div className="voter-list-card glass-panel">
                    <div className="list-header">
                        <h3>Registered Voters ({voters.length})</h3>
                        <div className="search-box">
                            <Search size={16} />
                            <input placeholder="Search address..." />
                        </div>
                    </div>

                    <div className="voter-table-container">
                        {voters.length > 0 ? (
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Wallet Address</th>
                                        <th>Registered</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voters.map((v) => (
                                        <tr key={v.wallet_address}>
                                            <td className="mono-font">{v.wallet_address}</td>
                                            <td>{new Date(v.registered_at).toLocaleDateString()}</td>
                                            <td>
                                                {v.hasVoted ? (
                                                    <span className="status-badge voted">Voted</span>
                                                ) : (
                                                    <span className="status-badge not-voted">Not Voted</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state-large">
                                <ShieldAlert size={48} color="var(--accent)" />
                                <p>No voters registered yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .voter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .registration-card, .voter-list-card { padding: 2rem; border-radius: 16px; height: fit-content; }
                
                .tab-header { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
                .tab-btn { background: none; border: none; color: var(--text-muted); padding-bottom: 0.8rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; font-size: 0.95rem; display: flex; gap: 0.5rem; align-items: center; transition: all 0.2s; }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
                .tab-btn:hover { color: var(--text-main); }

                .input-group { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
                .input-group input { flex: 1; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); }
                .helper-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; margin-left: 0.5rem; }

                textarea { width: 100%; height: 120px; resize: none; margin-top: 0.5rem; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: #f8fafc; }

                .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .search-box { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid var(--border-color); width: 200px; }
                .search-box input { background: transparent; border: none; color: var(--text-main); font-size: 0.9rem; padding: 0; width: 100%; }
                .search-box input:focus { outline: none; }

                .mono-font { font-family: 'Courier New', monospace; color: var(--primary); font-weight: 500; font-size: 0.9rem; }
                
                .status-badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .status-badge.voted { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
                .status-badge.not-voted { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }

                .empty-state-large { display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--text-muted); padding: 3rem 0; gap: 1rem; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease; }
            `}</style>
        </div>
    );
};

export default VoterManager;
