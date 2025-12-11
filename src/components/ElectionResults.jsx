import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const ElectionResults = () => {
    const contract = useContract();
    const [electionId, setElectionId] = useState("");
    const [results, setResults] = useState([]);

    const fetchResults = async () => {
        if (!contract || !electionId) return;
        try {
            const positionIds = await contract.getPositionIds(electionId);
            const loadedResults = [];

            for (let pid of positionIds) {
                const pos = await contract.getPosition(pid);
                const candidateIds = await contract.getCandidateIds(pid);
                const candidates = [];
                for (let cid of candidateIds) {
                    const cand = await contract.getCandidate(cid);
                    candidates.push(cand);
                }
                loadedResults.push({ ...pos, candidates });
            }
            setResults(loadedResults);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="results-view">
            <div className="form-group">
                <input
                    className="input-field"
                    placeholder="Enter Election ID for Results"
                    value={electionId}
                    onChange={(e) => setElectionId(e.target.value)}
                />
                <button className="btn-primary" onClick={fetchResults}>Show Results</button>
            </div>

            {results.map(pos => (
                <div key={pos.id} className="glass-panel" style={{ marginTop: '20px' }}>
                    <h3>{pos.name} - Results</h3>
                    <div className="results-list">
                        {pos.candidates.map(cand => (
                            <div key={cand.id} className="result-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <span>{cand.name}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{cand.voteCount.toString()} Votes</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ElectionResults;
