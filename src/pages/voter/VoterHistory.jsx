import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { FileCheck, ExternalLink, RefreshCw } from 'lucide-react';

const VoterHistory = () => {
    const { currentAccount } = useContext(Web3Context);
    const [receipts, setReceipts] = useState([]);

    useEffect(() => {
        if (currentAccount) loadReceipts();
    }, [currentAccount]);

    const loadReceipts = () => {
        const key = `nacoss_receipts_${currentAccount}`;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        setReceipts(data);
    };

    return (
        <div className="voter-history">
            <div className="history-header">
                <div>
                    <h2>My Voting Receipts</h2>
                    <p>Official record of your interactions with the blockchain.</p>
                </div>
                <button className="btn-icon" onClick={loadReceipts} title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            {receipts.length > 0 ? (
                <div className="receipts-list">
                    {receipts.map((r, idx) => (
                        <div key={idx} className="receipt-card glass animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="receipt-icon">
                                <FileCheck size={24} />
                            </div>
                            <div className="receipt-content">
                                <h3>Voted for: {r.candidateName}</h3>
                                <span className="election-name">{r.electionName}</span>
                                <span className="timestamp">{new Date(r.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="receipt-meta">
                                <div className="tx-hash">
                                    <span className="label">TX Hash:</span>
                                    <code>{r.txHash.slice(0, 12)}...</code>
                                </div>
                                <a
                                    href={`https://etherscan.io/tx/${r.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="verify-link"
                                >
                                    Verify <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileCheck size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                    <h3>No votes recorded yet</h3>
                    <p>When you cast a vote, your digital receipt will appear here.</p>
                </div>
            )}

            <style jsx>{`
                .voter-history { max-width: 800px; margin: 0 auto; }
                .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .history-header h2 { margin: 0; font-size: 1.8rem; }
                .history-header p { color: var(--text-muted); margin-top: 0.5rem; }

                .btn-icon { background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.6rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
                .btn-icon:hover { background: rgba(255,255,255,0.2); }

                .receipts-list { display: flex; flex-direction: column; gap: 1rem; }
                
                .receipt-card { 
                    display: flex; 
                    align-items: center; 
                    gap: 1.5rem; 
                    padding: 1.5rem; 
                    border-radius: 12px;
                    border-left: 4px solid var(--accent);
                }

                .receipt-icon { 
                    background: rgba(37, 99, 235, 0.1); 
                    color: var(--accent); 
                    padding: 1rem; 
                    border-radius: 50%; 
                }

                .receipt-content { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
                .receipt-content h3 { margin: 0; font-size: 1.1rem; }
                .election-name { color: var(--secondary); font-size: 0.9rem; font-weight: 500; }
                .timestamp { color: var(--text-muted); font-size: 0.8rem; }

                .receipt-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
                .tx-hash { font-size: 0.8rem; background: rgba(0,0,0,0.3); padding: 0.3rem 0.6rem; border-radius: 4px; display: flex; gap: 0.5rem; color: var(--text-muted); }
                .verify-link { color: var(--accent); text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 0.3rem; }
                .verify-link:hover { text-decoration: underline; }

                .empty-state { text-align: center; padding: 4rem; background: rgba(255,255,255,0.02); border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-muted); }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.4s ease forwards; opacity: 0; }
            `}</style>
        </div>
    );
};

export default VoterHistory;
