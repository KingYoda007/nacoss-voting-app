import React, { useEffect, useState, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Vote, Layers, Activity } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const Overview = () => {
    const { provider } = useContext(Web3Context);
    const { contract } = useContract(provider);

    const [stats, setStats] = useState({
        totalElections: 0,
        activeElections: 0,
        totalCandidates: 0,
        totalVotes: 0,
        totalVoters: 0
    });

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            // Only fetch if provider is ready (though we can fetch non-contract stats without it)
            try {
                setLoading(true);

                // 1. Fetch Counts from Supabase Tables
                const { count: electionCount } = await supabase.from('elections').select('*', { count: 'exact', head: true });
                const { count: activeCount } = await supabase.from('elections').select('*', { count: 'exact', head: true }).eq('isActive', true);
                const { count: candidateCount } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
                const { count: voterCount } = await supabase.from('voters').select('*', { count: 'exact', head: true });

                // 2. Prepare Chart Data & Calculate Total Live Votes
                let totalLiveVotes = 0;
                let chart = [];

                // Get active election
                const { data: activeElections } = await supabase.from('elections').select('id, name').eq('isActive', true).limit(1);

                if (activeElections && activeElections.length > 0) {
                    const activeElection = activeElections[0];

                    // Fetch positions for this election
                    const { data: positions } = await supabase.from('positions').select('id, name, contract_position_id').eq('election_id', activeElection.id);

                    if (positions && positions.length > 0) {
                        for (let pos of positions) {
                            let positionVotes = 0;
                            // Get candidates from Supabase to know who to check on-chain
                            const { data: cands } = await supabase.from('candidates').select('*').eq('position_id', pos.id);

                            if (cands && cands.length > 0) {
                                for (let cand of cands) {
                                    // Default to 0
                                    let candVotes = 0;

                                    // If contract is connected, fetch live
                                    if (contract && cand.contract_candidate_id !== undefined && cand.contract_candidate_id !== null) {
                                        try {
                                            const chainCand = await contract.candidates(cand.contract_candidate_id);
                                            candVotes = Number(chainCand.voteCount || chainCand[4]);
                                        } catch (e) {
                                            console.warn("Error fetching candidate stats from chain", e);
                                        }
                                    }

                                    positionVotes += candVotes;
                                }
                            }

                            totalLiveVotes += positionVotes;

                            chart.push({
                                name: pos.name || 'Unknown',
                                votes: positionVotes
                            });
                        }
                    }
                }

                setChartData(chart);

                setStats({
                    totalElections: electionCount || 0,
                    activeElections: activeCount || 0,
                    totalCandidates: candidateCount || 0,
                    totalVotes: totalLiveVotes, // Use live tally
                    totalVoters: voterCount || 0
                });


            } catch (err) {
                console.error("Error fetching overview:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [contract]); // Re-run when contract is ready

    return (
        <div className="content-area animate-fade-in">
            <div className="page-header">
                <div className="page-title">
                    <h2>Dashboard Overview</h2>
                    <p>Real-time insights into the ongoing election.</p>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="stats-grid">
                <div className="stat-card glass-panel card-hover">
                    <div className="icon-wrapper bg-blue">
                        <Vote size={24} />
                    </div>
                    <div>
                        <h3>Total Votes</h3>
                        <p className="stat-value">{stats.totalVotes.toLocaleString()}</p>
                        <span className="stat-label">Recorded On-Chain</span>
                    </div>
                </div>

                <div className="stat-card glass-panel card-hover">
                    <div className="icon-wrapper bg-purple">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3>Registered Voters</h3>
                        <p className="stat-value">{(stats.totalVoters || 0).toLocaleString()}</p>
                        <span className="stat-label">Eligible to vote</span>
                    </div>
                </div>

                <div className="stat-card glass-panel card-hover">
                    <div className="icon-wrapper bg-orange">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3>Total Elections</h3>
                        <p className="stat-value">{stats.totalElections}</p>
                        <span className="stat-label">{stats.activeElections} Currently Active</span>
                    </div>
                </div>

                <div className="stat-card glass-panel card-hover">
                    <div className="icon-wrapper bg-cyan">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3>Active Candidates</h3>
                        <p className="stat-value">{stats.totalCandidates}</p>
                        <span className="stat-label">Across all positions</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section glass-panel">
                <div className="section-header">
                    <h3>Live Results</h3>
                    {stats.activeElections > 0 && <span className="badge active">Live Updates</span>}
                </div>

                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="votes"
                                    fill="url(#colorGradient)"
                                    radius={[8, 8, 0, 0]}
                                    barSize={50}
                                />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="empty-chart">
                        <div className="icon-circle">
                            <Activity size={32} />
                        </div>
                        <p>No active election data to display.</p>
                        <button className="btn-secondary" style={{ marginTop: '1rem' }}>Create Election</button>
                    </div>
                )}
            </div>

            <style>{`
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            transition: transform 0.2s;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
        }
        .stat-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }

        .stat-icon {
            padding: 12px;
            border-radius: 10px;
        }

        .stat-info h3 { margin: 0; font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
        .stat-value { margin: 0.5rem 0; font-size: 2rem; font-weight: 700; color: var(--primary); }
        .stat-trend { font-size: 0.85rem; color: var(--text-muted); }
        .text-green { color: #16a34a; font-weight: 500; }

        .charts-section { margin-top: 2rem; }
        .chart-card { background: white; padding: 1.5rem; border-radius: 16px; min-height: 350px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
        .chart-header { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
        .chart-header h3 { margin: 0; color: var(--primary); }
      `}</style>
        </div>
    );
};

export default Overview;
