import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { supabase } from '../../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Award, Activity, Calendar, RefreshCcw } from 'lucide-react';

const VoterResults = () => {
    const { provider } = useContext(Web3Context);
    const { contract } = useContract();

    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState('');
    const [resultsData, setResultsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // 1. Fetch Elections
    useEffect(() => {
        const fetchElections = async () => {
            try {
                const { data } = await supabase.from('elections').select('*').order('created_at', { ascending: false });
                setElections(data || []);
                if (data && data.length > 0) {
                    const active = data.find(e => e.isActive);
                    setSelectedElectionId(active ? active.id : data[0].id);
                }
            } catch (err) {
                console.error("Error fetching elections:", err);
            }
        };
        fetchElections();
    }, []);

    // 2. Fetch Results
    useEffect(() => {
        if (selectedElectionId) {
            fetchResults(selectedElectionId);
        }
    }, [selectedElectionId, contract]);

    const fetchResults = async (electionId) => {
        setLoading(true);
        try {
            const { data: positions } = await supabase.from('positions').select('*').eq('election_id', electionId);

            if (!positions || positions.length === 0) {
                setResultsData([]);
                setLoading(false);
                return;
            }

            const { data: candidates } = await supabase.from('candidates').select('*').eq('election_id', electionId);

            const structuredResults = positions.map(pos => {
                const posCandidates = candidates.filter(c => c.position_id === pos.id);
                return {
                    ...pos,
                    candidates: posCandidates.map(c => ({
                        ...c,
                        voteCount: 0
                    }))
                };
            });

            if (contract) {
                setSyncing(true);
                for (let pos of structuredResults) {
                    for (let cand of pos.candidates) {
                        try {
                            if (cand.contract_candidate_id !== undefined) {
                                const chainCand = await contract.candidates(cand.contract_candidate_id);
                                const votes = Number(chainCand.voteCount || chainCand[4]);
                                cand.voteCount = votes;
                            }
                        } catch (err) {
                            console.warn(`Failed to sync votes for ${cand.name}:`, err);
                        }
                    }
                    pos.candidates.sort((a, b) => b.voteCount - a.voteCount);
                }
                setSyncing(false);
            }

            setResultsData(structuredResults);

        } catch (err) {
            console.error("Error fetching results:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (selectedElectionId) fetchResults(selectedElectionId);
    };

    const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

    return (
        <div className="content-area animate-fade-in">
            <div className="page-header">
                <div className="page-title">
                    <h2>Live Election Results</h2>
                    <p>View real-time voting results directly from the blockchain.</p>
                </div>
                <div className="header-actions" style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
                    <select
                        className="select-input"
                        value={selectedElectionId}
                        onChange={(e) => setSelectedElectionId(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        {elections.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.name} {e.isActive ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>

                    <button onClick={handleRefresh} className="btn-secondary" title="Refresh Live Data">
                        <RefreshCcw size={18} className={syncing ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state glass-panel">
                    <Activity size={32} className="spin" style={{ color: 'var(--primary)' }} />
                    <p>Fetching result data...</p>
                </div>
            ) : resultsData.length === 0 ? (
                <div className="empty-state glass-panel">
                    <p>No results found for this election.</p>
                </div>
            ) : (
                <div className="results-grid">
                    {resultsData.map((position, idx) => {
                        const winner = position.candidates[0];
                        const totalVotes = position.candidates.reduce((acc, c) => acc + c.voteCount, 0);

                        return (
                            <div key={position.id} className="position-result-card glass-panel">
                                <div className="position-header">
                                    <h3>{position.name}</h3>
                                    <span className="badge">{totalVotes} Total Votes</span>
                                </div>

                                <div className="result-layout">
                                    {/* Winner Spotlight */}
                                    {winner && winner.voteCount > 0 && (
                                        <div className="winner-spotlight">
                                            <div className="winner-badge">
                                                <Trophy size={16} fill="gold" color="goldenrod" />
                                                <span>Leading</span>
                                            </div>
                                            <img src={winner.ipfsImageUrl || winner.imageUrl} alt={winner.name} className="winner-img" />
                                            <div className="winner-info">
                                                <h4>{winner.name}</h4>
                                                <p className="vote-count">{winner.voteCount} Votes</p>
                                                <div className="vote-bar">
                                                    <div className="fill" style={{ width: `${(winner.voteCount / totalVotes) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chart & List */}
                                    <div className="chart-container">
                                        <div style={{ width: '100%', height: 200 }}>
                                            <ResponsiveContainer>
                                                <BarChart data={position.candidates} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Bar dataKey="voteCount" radius={[0, 4, 4, 0]} barSize={20}>
                                                        {position.candidates.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
                .position-result-card { padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); }
                .position-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
                .position-header h3 { margin: 0; color: var(--text-main); font-size: 1.2rem; }
                
                .result-layout { display: flex; gap: 1.5rem; flex-wrap: wrap; }
                
                .winner-spotlight { flex: 1; min-width: 180px; background: linear-gradient(145deg, #ffffff, #f8faff); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; }
                .winner-badge { position: absolute; top: 0; right: 0; background: #fffbeb; color: #b45309; font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-bottom-left-radius: 8px; display: flex; align-items: center; gap: 4px; }
                .winner-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 0.8rem; }
                .winner-info h4 { margin: 0; font-size: 1rem; color: var(--text-main); }
                .vote-count { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0.2rem 0; }
                .vote-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 0.5rem; overflow: hidden; }
                .vote-bar .fill { height: 100%; background: var(--primary); border-radius: 3px; }

                .chart-container { flex: 2; min-width: 250px; }
                
                .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-muted); gap: 1rem; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default VoterResults;
