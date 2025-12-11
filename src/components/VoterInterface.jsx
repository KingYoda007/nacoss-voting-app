import React, { useState, useEffect, useContext } from 'react';
import { useContract } from '../hooks/useContract';
import { Web3Context } from '../context/Web3Context';

const VoterInterface = () => {
    const { currentAccount } = useContext(Web3Context);
    const contract = useContract();

    // State
    const [electionId, setElectionId] = useState("");
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch positions when electionId is set
    useEffect(() => {
        if (contract && electionId) {
            fetchPositions();
        }
    }, [contract, electionId]);

    const fetchPositions = async () => {
        try {
            setLoading(true);
            const positionIds = await contract.getPositionIds(electionId);
            const loadedPositions = [];

            for (let pid of positionIds) {
                const pos = await contract.getPosition(pid);
                const candidateIds = await contract.getCandidateIds(pid);
                const candidates = [];
                for (let cid of candidateIds) {
                    const cand = await contract.getCandidate(cid);
                    candidates.push(cand);
                }
                // Check if user has voted
                const hasVoted = await contract.hasVoted(currentAccount, pid);

                loadedPositions.push({ ...pos, candidates, hasVoted });
            }
            setPositions(loadedPositions);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const castVote = async (pid, cid) => {
        if (!contract) return;
        try {
            const tx = await contract.castVote(electionId, pid, cid);
            await tx.wait();
            alert("Vote Cast Successfully!");
            fetchPositions(); // Refresh
        } catch (error) {
            console.error(error);
            alert("Error casting vote: " + (error.reason || error.message));
        }
    };

    return (
        <div className="voter-interface">
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                    className="input-field"
                    placeholder="Enter Election ID to Vote"
                    value={electionId}
                    onChange={(e) => setElectionId(e.target.value)}
                />
                <button className="btn-primary" onClick={fetchPositions}>Load Election</button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="positions-list">
                    {positions.map((pos) => (
                        <div key={pos.id} className="glass-panel" style={{ marginBottom: '20px' }}>
                            <h3>{pos.name}</h3>
                            {pos.hasVoted ? (
                                <div className="alert-success">You have voted for this position.</div>
                            ) : (
                                <div className="candidates-grid">
                                    {pos.candidates.map(cand => (
                                        <div key={cand.id} className="candidate-card">
                                            {cand.ipfsImageUrl && <img src={cand.ipfsImageUrl} alt={cand.name} className="candidate-img" />}
                                            <h4>{cand.name}</h4>
                                            <p className="text-secondary">{cand.info}</p>
                                            <button className="btn-primary" onClick={() => castVote(pos.id, cand.id)}>Vote</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                .candidates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .candidate-card {
                    background: rgba(255,255,255,0.05);
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                }
                .candidate-card:hover {
                    background: rgba(255,255,255,0.1);
                }
                .candidate-img {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    margin-bottom: 0.5rem;
                }
                .alert-success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default VoterInterface;
