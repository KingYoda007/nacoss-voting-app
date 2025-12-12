import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Vote, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../utils/supabaseClient';

const VotingBooth = () => {
    const { provider, signer, currentAccount } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);
    const { showToast } = useToast();

    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [candidates, setCandidates] = useState({}); // Map posId -> candidates[]
    const [votingStatus, setVotingStatus] = useState({}); // Map posId -> boolean (hasVoted)

    // UI State
    const [loading, setLoading] = useState(false);
    const [confirmVote, setConfirmVote] = useState(null); // { candidate, positionId, electionId }
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        if (contract) fetchActiveElections();
    }, [contract]);

    const fetchActiveElections = async () => {
        try {
            setLoading(true);
            const { data: electionsData, error } = await supabase
                .from('elections')
                .select(`
                    *,
                    positions (count),
                    votes (count)
                `)
                .eq('isActive', true)
                .order('startTime', { ascending: false });

            if (error) throw error;

            const enhancedElections = [];
            for (const el of electionsData) {
                // Get User Vote Count for this election
                const { count: userVoteCount } = await supabase
                    .from('votes')
                    .select('*', { count: 'exact', head: true })
                    .eq('election_id', el.id)
                    .eq('voter_address', currentAccount); // Assumes currentAccount is set

                const totalPositions = el.positions?.[0]?.count || 0;
                const progress = totalPositions > 0 ? (userVoteCount / totalPositions) * 100 : 0;

                enhancedElections.push({
                    ...el,
                    totalPositions,
                    userPositionsVoted: userVoteCount,
                    progress,
                    isComplete: userVoteCount >= totalPositions && totalPositions > 0
                });
            }

            setElections(enhancedElections);
        } catch (err) {
            console.error("Fetch Active Elections Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadElectionData = async (election) => {
        setSelectedElection(election);
        setLoading(true);
        try {
            const posIds = await contract.getPositionIds(election.id);
            const loadedPos = [];
            const loadedCandidates = {};
            const loadedStatus = {};

            for (let pid of posIds) {
                const p = await contract.getPosition(pid);
                loadedPos.push({ id: Number(p.id), name: p.name });

                // Get Candidates
                const cIds = await contract.getCandidateIds(pid);
                const cList = [];
                for (let cid of cIds) {
                    const c = await contract.getCandidate(cid);
                    cList.push({
                        id: Number(c.id),
                        name: c.name,
                        info: c.info,
                        ipfsImageUrl: c.ipfsImageUrl
                    });
                }
                loadedCandidates[Number(p.id)] = cList;

                // Check if user voted
                if (currentAccount) {
                    const hasVoted = await contract.hasVoted(currentAccount, pid);
                    loadedStatus[Number(p.id)] = hasVoted;
                }
            }

            setPositions(loadedPos);
            setCandidates(loadedCandidates);
            setVotingStatus(loadedStatus);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCastVote = async () => {
        if (!confirmVote || !selectedElection) return;

        // Double check time
        if (Date.now() / 1000 > selectedElection.endTime) {
            showToast("Election has ended!", "error");
            return;
        }

        try {
            const tx = await contract.castVote(selectedElection.id, confirmVote.positionId, confirmVote.candidate.id);
            const receipt = await tx.wait();

            const receiptObj = {
                txHash: receipt.hash,
                electionName: selectedElection.name,
                candidateName: confirmVote.candidate.name,
                positionName: positions.find(p => p.id === confirmVote.positionId)?.name,
                timestamp: Date.now()
            };

            // Save Receipt Locally
            saveReceipt(receiptObj);

            // Persist to DB
            try {
                await supabase.from('votes').insert([{
                    election_id: selectedElection.id,
                    position_id: confirmVote.positionId,
                    candidate_id: confirmVote.candidate.id,
                    voter_address: currentAccount,
                    transaction_hash: receipt.hash
                }]);
            } catch (dbError) {
                console.error("Failed to save vote to DB:", dbError);
            }

            // Show Receipt Modal
            setReceiptData(receiptObj);
            setConfirmVote(null);

            // Refresh Status
            setVotingStatus(prev => ({ ...prev, [confirmVote.positionId]: true }));
        } catch (err) {
            console.error(err);
            showToast("Voting failed: " + (err.reason || err.message), "error");
        }
    };

    const saveReceipt = (receipt) => {
        const key = `nacoss_receipts_${currentAccount}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([receipt, ...existing]));
    }

    return (
        <div className="voting-booth">
            {!selectedElection ? (
                /* 1. Election Selection */
                <div className="selection-view animate-fade-in">
                    <div className="header-section">
                        <h2>Active Elections</h2>
                        <span className="badge-pill">{elections.length} Active</span>
                    </div>

                    <div className="elections-list">
                        {elections.map(el => (
                            <div key={el.id} className="election-card-purple">
                                <div className="card-top-accent">
                                    <h3>{el.name}</h3>
                                    <div className="timer-badge">
                                        <Clock size={14} />
                                        <span>
                                            {Math.ceil((el.endTime - (Date.now() / 1000)) / 86400)} days remaining
                                        </span>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <p className="description">
                                        Annual election for positions. Cast your vote securely.
                                    </p>

                                    <div className="progress-section">
                                        <div className="progress-labels">
                                            <span>Your Progress</span>
                                            <span>{el.userPositionsVoted}/{el.totalPositions} positions</span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${el.progress}%`, background: el.isComplete ? '#22c55e' : 'var(--accent)' }}
                                            ></div>
                                        </div>
                                    </div>

                                    {el.isComplete ? (
                                        <button className="vote-action-btn complete" disabled>
                                            <CheckCircle size={18} /> Voting Complete
                                        </button>
                                    ) : (Date.now() / 1000 > el.endTime) ? (
                                        <button className="vote-action-btn complete" disabled style={{ background: '#94a3b8', color: 'white' }}>
                                            <Clock size={18} /> Election Ended
                                        </button>
                                    ) : (
                                        <button className="vote-action-btn active" onClick={() => loadElectionData(el)}>
                                            <Vote size={18} /> Vote Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {elections.length === 0 && !loading && <p className="empty-msg">No active elections found.</p>}
                    </div>
                </div>
            ) : (
                /* 2. Ballot View */
                <div className="ballot-view animate-fade-in">
                    <button className="back-link" onClick={() => setSelectedElection(null)}>← Back to Elections</button>

                    <div className="ballot-header">
                        <h1>{selectedElection.name}</h1>
                        <p>Complete your ballot below. You can only vote once per position.</p>
                    </div>

                    {loading ? <p>Loading ballot...</p> : (
                        <div className="positions-list">
                            {positions.map(pos => (
                                <div key={pos.id} className="position-section glass">
                                    <div className="position-header">
                                        <h3>{pos.name}</h3>
                                        {votingStatus[pos.id] ? (
                                            <span className="voted-badge"><CheckCircle size={14} /> Voted</span>
                                        ) : (
                                            <span className="pending-badge">Select Candidate</span>
                                        )}
                                    </div>

                                    {!votingStatus[pos.id] ? (
                                        <div className="candidates-grid">
                                            {candidates[pos.id]?.map(c => (
                                                <div key={c.id} className="candidate-choice glass">
                                                    <img src={c.ipfsImageUrl} alt={c.name} />
                                                    <div className="choice-info">
                                                        <h4>{c.name}</h4>
                                                        <p>{c.info}</p>
                                                        <button className="vote-btn" onClick={() => setConfirmVote({ candidate: c, positionId: pos.id })}>
                                                            Vote
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="voted-message">
                                            <CheckCircle size={48} color="#22c55e" />
                                            <p>You have cast your vote for this position.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmVote && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <AlertCircle size={48} color="var(--secondary)" className="modal-icon" />
                        <h2>Confirm Your Vote</h2>
                        <p>Are you sure you want to vote for <strong>{confirmVote.candidate.name}</strong>?</p>
                        <p className="warning">This action is irreversible and recorded on the blockchain.</p>

                        <div className="modal-actions">
                            <button className="btn-text" onClick={() => setConfirmVote(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleCastVote}>Confirm & Vote</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {receiptData && (
                <div className="modal-overlay">
                    <div className="modal-content receipt-modal">
                        <div className="receipt-header">
                            <CheckCircle size={56} color="#22c55e" style={{ marginBottom: '1rem' }} />
                            <h2>Vote Successful!</h2>
                            <p>Your vote has been recorded on the blockchain.</p>
                        </div>

                        <div className="receipt-details">
                            <div className="detail-row">
                                <span className="label">Candidate:</span>
                                <span className="value"><strong>{receiptData.candidateName}</strong></span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Position:</span>
                                <span className="value">{receiptData.positionName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Election:</span>
                                <span className="value">{receiptData.electionName}</span>
                            </div>
                            <div className="detail-row full">
                                <span className="label">Transaction Hash:</span>
                                <span className="value mono">{receiptData.txHash.slice(0, 20)}...</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Date:</span>
                                <span className="value">{new Date(receiptData.timestamp).toLocaleString()}</span>
                            </div>
                        </div>

                        <button className="btn-primary" onClick={() => setReceiptData(null)} style={{ marginTop: '2rem', width: '100%' }}>Close Receipt</button>
                    </div>
                </div>
            )}

            <style>{`
                .voting-booth { max-width: 900px; margin: 0 auto; color: var(--text-main); }
                .header-section { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
                .header-section h2 { font-size: 1.8rem; margin: 0; color: var(--text-main); }
                .badge-pill { background: #dcfce7; color: #166534; padding: 0.2rem 1rem; border-radius: 99px; font-weight: 600; font-size: 0.9rem; }

                .elections-list { display: grid; grid-template-columns: 1fr; gap: 2rem; }
                
                .election-card-purple { border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border-color); transition: transform 0.2s; }
                .election-card-purple:hover { transform: translateY(-4px); }
                
                .card-top-accent { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 1.5rem; color: white; display: flex; justify-content: space-between; align-items: flex-start; }
                .card-top-accent h3 { margin: 0; font-size: 1.4rem; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                
                .timer-badge { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.2); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; backdrop-filter: blur(4px); }
                
                .card-body { padding: 1.5rem; }
                .description { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.5; }
                
                .progress-section { margin-bottom: 1.5rem; }
                .progress-labels { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }
                .progress-track { width: 100%; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
                
                .vote-action-btn { width: 100%; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: filter 0.2s; }
                .vote-action-btn.active { background: #4f46e5; color: white; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3); }
                .vote-action-btn.active:hover { filter: brightness(1.1); }
                
                .vote-action-btn.complete { background: #dcfce7; color: #166534; cursor: default; }
                
                .empty-msg { text-align: center; color: var(--text-muted); padding: 3rem; }

                /* Ballot View and Modal Styles (Preserved/Updated) */
                .selection-view, .ballot-view { animation: fadeIn 0.3s ease; }
                .ballot-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .ballot-header h1 { font-size: 2rem; color: #6d28d9; margin: 0 0 0.5rem 0; }
                
                .position-section { padding: 2rem; border-radius: 16px; border: 1px solid var(--border-color); background: white; margin-bottom: 2rem; }
                .position-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
                .position-header h3 { margin: 0; font-size: 1.3rem; color: var(--text-main); }
                
                .pending-badge { background: #fef3c7; color: #d97706; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
                .voted-badge { background: #dcfce7; color: #166534; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }

                .candidates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
                .candidate-choice { border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: all 0.2s; }
                .candidate-choice:hover { border-color: #8b5cf6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15); }
                .candidate-choice img { width: 100%; height: 180px; object-fit: cover; }
                .choice-info { padding: 1.2rem; }
                .choice-info h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
                .vote-btn { width: 100%; background: var(--accent); color: white; border: none; padding: 0.6rem; border-radius: 6px; font-weight: 500; cursor: pointer; margin-top: 1rem; }
                
                .back-link { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.95rem; margin-bottom: 1rem; padding: 0; display: flex; align-items: center; gap: 0.5rem; }
                .back-link:hover { color: var(--primary); }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { background: white; padding: 2.5rem; border-radius: 16px; width: 90%; max-width: 450px; text-align: center; border: 1px solid var(--border-color); box-shadow: var(--shadow-xl); }
                .modal-icon { margin-bottom: 1rem; }
                .warning { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; background: #fee2e2; padding: 0.5rem; border-radius: 8px; }
                .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; justify-content: center; }
                .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                /* Receipt Modal Specifics */
                .receipt-modal { text-align: center; }
                .receipt-header h2 { margin-bottom: 0.5rem; }
                .receipt-header p { color: var(--text-muted); margin-bottom: 2rem; }
                .receipt-details { background: #f8fafc; padding: 1.5rem; border-radius: 8px; text-align: left; display: flex; flex-direction: column; gap: 0.8rem; }
                .detail-row { display: flex; justify-content: space-between; font-size: 0.9rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
                .detail-row:last-child { border-bottom: none; }
                .detail-row.full { flex-direction: column; gap: 0.2rem; }
                .detail-row .label { color: var(--text-muted); font-size: 0.85rem; }
                .detail-row .value { font-weight: 500; color: var(--text-main); word-break: break-all; }
                .value.mono { font-family: monospace; color: var(--primary); font-size: 0.8rem; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default VotingBooth;
