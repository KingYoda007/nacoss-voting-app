import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserCheck, Upload, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';

const VoterManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);
    const { showToast } = useToast();

    const [voterAddress, setVoterAddress] = useState('');
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchVoters();
    }, []);

    const fetchVoters = async () => {
        try {
            const { data, error } = await supabase
                .from('voters')
                .select('*')
                .order('registered_at', { ascending: false });
            if (error) throw error;
            setVoters(data || []);
        } catch (err) {
            console.error("Error fetching voters:", err);
        }
    };

    const handleRegisterSingle = async () => {
        if (!ethers.isAddress(voterAddress)) return showToast("Invalid Wallet Address", "error");
        try {
            // 1. Register on Blockchain
            const tx = await contract.registerVoters([voterAddress]);
            await tx.wait();

            // 2. Save to Supabase
            const { error } = await supabase.from('voters').insert([
                { wallet_address: voterAddress }
            ]);

            if (error) {
                // Ignore duplicate key error (if already in DB but not on chain for some reason)
                if (error.code !== '23505') console.error("Supabase Error:", error);
            }

            showToast("Voter Registered Successfully!", "success");
            setVoterAddress('');
            fetchVoters();
        } catch (err) {
            console.error(err);
            showToast("Error registering voter: " + (err.reason || err.message), "error");
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
                        <button className="tab-btn active">Single Registration</button>
                        <button className="tab-btn">Bulk Registration</button>
                    </div>

                    <div className="form-content">
                        <label>Voter Wallet Address</label>
                        <div className="input-group">
                            <input
                                placeholder="0x..."
                                value={voterAddress}
                                onChange={e => setVoterAddress(e.target.value)}
                            />
                            <button className="btn-primary" onClick={handleRegisterSingle}>
                                <UserCheck size={18} /> Register
                            </button>
                        </div>
                        <p className="helper-text">ensure the address is a valid Ethereum wallet address.</p>
                    </div>

                    <div className="bulk-content" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                        <label>Bulk Upload (Coming Soon)</label>
                        <textarea placeholder="Paste comma-separated addresses..." disabled></textarea>
                        <button className="btn-primary" disabled style={{ marginTop: '1rem', opacity: 0.5 }}>
                            <Upload size={18} /> Process Batch
                        </button>
                    </div>
                </div>

                {/* Voter List (Placeholder for now as contract doesn't have iterable voters) */}
                <div className="voter-list-card glass-panel">
                    <div className="list-header">
                        <h3>Registered Voters</h3>
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
                                        <th>Registered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voters.map((v) => (
                                        <tr key={v.wallet_address}>
                                            <td className="mono-font">{v.wallet_address}</td>
                                            <td>{new Date(v.registered_at).toLocaleDateString()}</td>
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
                .tab-btn { background: none; border: none; color: var(--text-muted); padding-bottom: 0.5rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; font-size: 0.95rem; }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

                .input-group { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
                .input-group input { flex: 1; }
                .helper-text { font-size: 0.8rem; color: var(--text-light); margin-top: 0.5rem; }

                textarea { width: 100%; height: 100px; resize: none; margin-top: 0.5rem; }

                .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .search-box { display: flex; align-items: center; gap: 0.5rem; background: #ffffff; padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); }
                .search-box input { background: transparent; border: none; color: var(--text-main); font-size: 0.9rem; padding: 0; }
                .search-box input:focus { outline: none; box-shadow: none; border: none; }

                .mono-font { font-family: 'Courier New', monospace; color: var(--primary); font-weight: 500; }

                .empty-state-large { display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--text-muted); padding: 3rem 0; gap: 1rem; }
            `}</style>
        </div>
    );
};

// Helper for ethers
import { ethers } from 'ethers';
export default VoterManager;
