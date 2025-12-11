import React, { useState, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserCheck, Upload, Search, ShieldAlert } from 'lucide-react';

const VoterManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);

    const [voterAddress, setVoterAddress] = useState('');
    const [bulkData, setBulkData] = useState('');

    const handleRegisterSingle = async () => {
        if (!ethers.isAddress(voterAddress)) return alert("Invalid Address");
        try {
            const tx = await contract.registerVoters([voterAddress]);
            await tx.wait();
            alert("Voter Registered!");
            setVoterAddress('');
        } catch (err) {
            console.error(err);
            alert("Error registering voter");
        }
    };

    return (
        <div className="content-area">
            <div className="header-actions">
                <div>
                    <h2>Voter Registry</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Control who is eligible to vote in the elections.</p>
                </div>
            </div>

            <div className="voter-grid">
                {/* Registration Card */}
                <div className="registration-card glass">
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
                <div className="voter-list-card glass">
                    <div className="list-header">
                        <h3>Registered Voters</h3>
                        <div className="search-box">
                            <Search size={16} />
                            <input placeholder="Search address..." />
                        </div>
                    </div>

                    <div className="empty-state-large">
                        <ShieldAlert size={48} color="var(--accent)" />
                        <p>Voter enumeration not supported in current contract version.</p>
                        <small>You can verify individual eligibility via the checker tool.</small>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .voter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
                .registration-card, .voter-list-card { padding: 2rem; border-radius: 16px; height: fit-content; }
                
                .tab-header { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
                .tab-btn { background: none; border: none; color: var(--text-muted); padding-bottom: 0.5rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; }
                .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

                .input-group { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
                .input-group input { flex: 1; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
                .helper-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; }

                textarea { width: 100%; height: 100px; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: white; resize: none; margin-top: 0.5rem; }

                .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .search-box { display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; border-radius: 20px; }
                .search-box input { background: transparent; border: none; color: white; font-size: 0.9rem; }
                .search-box input:focus { outline: none; }

                .empty-state-large { display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--text-muted); padding: 3rem 0; gap: 1rem; }
            `}</style>
        </div>
    );
};

// Helper for ethers
import { ethers } from 'ethers';
export default VoterManager;
