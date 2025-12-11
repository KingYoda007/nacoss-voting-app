import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Vote, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

    useEffect(() => {
        if (contract) fetchActiveElections();
    }, [contract]);

    const fetchActiveElections = async () => {
        const count = await contract.electionCounter();
        const loaded = [];
        for (let i = 1; i <= Number(count); i++) {
            const el = await contract.getElectionDetails(i);
            if (el.isActive) {
                loaded.push({
                    id: i,
                    name: el.name,
                    endTime: Number(el.endTime)
                });
            }
        }
        setElections(loaded);
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
        if (!confirmVote) return;
        try {
            const tx = await contract.castVote(selectedElection.id, confirmVote.positionId, confirmVote.candidate.id);
            const receipt = await tx.wait();

            // Save Receipt Locally
            saveReceipt({
                txHash: receipt.hash,
                electionName: selectedElection.name,
                candidateName: confirmVote.candidate.name,
                timestamp: Date.now()
            });

            showToast(`Vote cast successfully! Tx: ${receipt.hash.slice(0, 10)}...`, "success");
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
                        <h2>Select an Election</h2>
                        <p>Choose an active poll to cast your vote.</p>
                    </div>

                    <div className="elections-grid">
                        {elections.map(el => (
                            <div key={el.id} className="election-card glass" onClick={() => loadElectionData(el)}>
                                <div className="card-badge">Open</div>
                                <h3>{el.name}</h3>
                                <div className="time-remaining">
                                    <Clock size={14} /> Ends: {new Date(el.endTime * 1000).toLocaleDateString()}
                                </div>
                                <button className="enter-btn">Enter Booth <ChevronRight size={16} /></button>
                            </div>
                        ))}
                        {elections.length === 0 && <p className="empty-msg">No active elections at the moment.</p>}
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

            <style>{`
                .voting-booth { max-width: 900px; margin: 0 auto; }
                .header-section { text-align: center; margin-bottom: 3rem; }
                .header-section h2 { font-size: 2rem; margin: 0; }
                .header-section p { color: var(--text-muted); }

                .elections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .election-card { padding: 2rem; border-radius: 16px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
                .election-card:hover { transform: translateY(-5px); border-color: var(--accent); }
                .card-badge { position: absolute; top: 1rem; right: 1rem; background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .election-card h3 { margin: 1rem 0 0.5rem 0; font-size: 1.25rem; }
                .time-remaining { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; }
                .enter-btn { background: transparent; color: var(--accent); border: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; padding: 0; }
                
                .ballot-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .positions-list { display: flex; flex-direction: column; gap: 3rem; }
                
                .position-section { padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .position-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .position-header h3 { margin: 0; font-size: 1.4rem; color: var(--secondary); }
                
                .voted-badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 0.3rem 0.8rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
                .pending-badge { background: rgba(255,255,255,0.1); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; }

                .candidates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
                .candidate-choice { border-radius: 12px; overflow: hidden; transition: transform 0.2s; display: flex; flex-direction: column; }
                .candidate-choice:hover { transform: scale(1.02); border-color: var(--accent); }
                .candidate-choice img { width: 100%; height: 160px; object-fit: cover; }
                .choice-info { padding: 1rem; flex: 1; display: flex; flex-direction: column; }
                .choice-info h4 { margin: 0; font-size: 1.1rem; }
                .choice-info p { font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 1rem 0; flex: 1; }
                .vote-btn { width: 100%; background: var(--accent); color: white; border: none; padding: 0.6rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .vote-btn:hover { background: #1d4ed8; }

                .voted-message { text-align: center; padding: 2rem; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { background: #0f172a; padding: 2.5rem; border-radius: 16px; width: 90%; max-width: 450px; text-align: center; display: flex; flex-direction: column; align-items: center; }
                .modal-icon { margin-bottom: 1rem; }
                .warning { color: #ef4444; font-size: 0.9rem; margin-top: 0.5rem; }
                .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; width: 100%; justify-content: center; }
            `}</style>
        </div>
    );
};

export default VotingBooth;
