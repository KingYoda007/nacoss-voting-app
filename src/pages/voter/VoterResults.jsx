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
                                const val = chainCand.voteCount ?? chainCand[4];
                                const votes = Number(val);
                                cand.voteCount = isNaN(votes) ? 0 : votes;
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

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                    <img
                        src={data.ipfsImageUrl || data.imageUrl}
                        alt={data.name}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                    />
                    <h4 style={{ margin: '0', fontSize: '1rem', color: 'var(--text-main)' }}>{data.name}</h4>
                    <p style={{ margin: '0.2rem 0', fontWeight: '700', color: 'var(--primary)', fontSize: '1.2rem' }}>{data.voteCount} Votes</p>
                </div>
            );
        }
        return null;
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
            ) : (() => {
                // Find selected election object
                const currentElection = elections.find(e => e.id == selectedElectionId);
                const now = Date.now() / 1000;

                // Show results if:
                // 1. Election is manually marked inactive (!isActive)
                // 2. OR Time has passed (now > endTime)
                // Therefore, it IS ongoing (hidden results) ONLY if: isActive AND time remains
                const isOngoing = currentElection && currentElection.isActive && now < currentElection.endTime;

                if (!currentElection) return null;

                if (isOngoing) {
                    return (
                        <div className="empty-state glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '1.5rem' }}>
                                <Activity size={48} color="var(--primary)" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Election in Progress</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                                Results are hidden while voting is active to ensure fairness.
                                Come back after <strong>{new Date(currentElection.endTime * 1000).toLocaleString()}</strong> to see the final tally.
                            </p>
                        </div>
                    );
                }

                if (resultsData.length === 0) {
                    return (
                        <div className="empty-state glass-panel">
                            <p>No results found to display.</p>
                        </div>
                    );
                }

                return (
                    <div className="results-grid animate-fade-in">
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
                                        {/* Chart & List */}
                                        <div className="chart-container">
                                            <div style={{ width: '100%', height: 250, minWidth: 200 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={position.candidates} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                                        <Bar dataKey="voteCount" radius={[4, 4, 0, 0]} barSize={40}>
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
                );
            })()}

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
