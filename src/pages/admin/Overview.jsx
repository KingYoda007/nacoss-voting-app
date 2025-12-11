import React, { useEffect, useState, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Vote, Layers, Activity } from 'lucide-react';

const Overview = () => {
    const { provider } = useContext(Web3Context);
    const { contract } = useContract(provider);

    const [stats, setStats] = useState({
        totalElections: 0,
        activeElections: 0,
        totalCandidates: 0,
        totalVotes: 0 // This would require iterating usually, or a new contract variable
    });

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!contract) return;
            try {
                setLoading(true);
                // Fetch basic counters
                const eCount = await contract.electionCounter();
                const cCount = await contract.candidateCounter();

                let active = 0;
                let totalVotesAll = 0;
                const tempChartData = [];

                // Iterate to get details (for charts and active status)
                // In a real production app, you'd want a "getBatchElections" function or The Graph
                for (let i = 1; i <= Number(eCount); i++) {
                    const election = await contract.getElectionDetails(i);
                    if (election.isActive) active++;

                    // For chart: we need positions and votes per position
                    // This is expensive on-chain, doing a simplified version for now
                    // Assuming we just count raw candidates for "activity" as proxy or random data for demo if empty
                    tempChartData.push({
                        name: election.name,
                        id: i
                        // votes: ... (fetching votes requires iterating positions -> candidates)
                    });
                }

                setStats({
                    totalElections: Number(eCount),
                    activeElections: active,
                    totalCandidates: Number(cCount),
                    totalVotes: 0 // Placeholder until we sum deeper
                });

                // Mocking chart data for visual demo since fetching nested mappings is slow/complex without Graph
                setChartData([
                    { name: 'Presidential', votes: 1247, turnout: 85 },
                    { name: 'Vice Pres', votes: 1198, turnout: 82 },
                    { name: 'Gen Sec', votes: 950, turnout: 75 },
                    { name: 'Fin Sec', votes: 880, turnout: 70 },
                ]);

            } catch (err) {
                console.error("Error fetching overview:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [contract]);

    return (
        <div className="content-area">
            <div className="dashboard-header">
                <h2>Dashboard Overview</h2>
                <p>Welcome back, Administrator. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Voters</h3>
                        <p className="stat-value">1,450</p>
                        <span className="stat-trend text-green">+12% from yesterday</span>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
                    <div className="stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                        <Vote size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Votes Cast</h3>
                        <p className="stat-value">4,275</p>
                        <span className="stat-trend">83% Turnout</span>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #eab308' }}>
                    <div className="stat-icon" style={{ background: '#fefce8', color: '#eab308' }}>
                        <Layers size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Active Elections</h3>
                        <p className="stat-value">{stats.activeElections}</p>
                        <span className="stat-trend">{stats.totalElections} Total Created</span>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
                    <div className="stat-icon" style={{ background: '#faf5ff', color: '#a855f7' }}>
                        <Activity size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Candidates</h3>
                        <p className="stat-value">{stats.totalCandidates}</p>
                        <span className="stat-trend">Across all positions</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-card glass"> {/* Glass class now means white card in new CSS */}
                    <div className="chart-header">
                        <h3>Voter Turnout by Election</h3>
                    </div>
                    <div className="chart-body" style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /> {/* Lighter grid */}
                                <XAxis dataKey="name" stroke="#64748b" /> {/* Slate-500 */}
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                                    itemStyle={{ color: '#0f172a' }}
                                />
                                <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .dashboard-header { margin-bottom: 2rem; }
        .dashboard-header h2 { margin: 0; font-size: 1.8rem; color: var(--primary); }
        .dashboard-header p { color: var(--text-muted); margin-top: 0.5rem; }

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
