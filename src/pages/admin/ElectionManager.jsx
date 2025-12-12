import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Plus, Calendar, Clock, CheckCircle, XCircle, ArrowRight, Settings } from 'lucide-react';
import { ethers } from 'ethers';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';

const ElectionManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract();
    const { showToast } = useToast();

    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({ name: '', startDate: '', startTime: '', endDate: '', endTime: '' });

    // Election Details Modal / View State
    const [selectedElection, setSelectedElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [newPositionName, setNewPositionName] = useState('');

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('elections')
                .select(`
                    *,
                    candidates(count),
                    votes(count)
                `)
                .order('id', { ascending: false });

            if (error) throw error;

            // Transform data to flatten counts
            const electionsWithCounts = (data || []).map(e => ({
                ...e,
                candidateCount: e.candidates?.[0]?.count || 0,
                voteCount: e.votes?.[0]?.count || 0
            }));

            setElections(electionsWithCounts);
        } catch (err) {
            console.error("Fetch elections error:", err);
            // Fallback: If DB empty/error, try contract (optional, or just show error)
        } finally {
            setLoading(false);
        }
    };

    const handleCreateElection = async (e) => {
        e.preventDefault();
        if (!contract) {
            return showToast("Wallet not connected! Please connect first.", "error");
        }
        try {
            const startTimestamp = Math.floor(new Date(`${form.startDate}T${form.startTime}`).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(`${form.endDate}T${form.endTime}`).getTime() / 1000);

            // 1. Create on Blockchain
            const tx = await contract.createElection(form.name, startTimestamp, endTimestamp);
            await tx.wait();

            // Get the Election ID from events (assuming it's the last one or we read from counter)
            // For simplicity, let's fetch the new counter
            const newId = await contract.electionCounter();

            // 2. Save to Supabase
            const { error } = await supabase.from('elections').insert([
                {
                    id: Number(newId),
                    name: form.name,
                    startTime: startTimestamp,
                    endTime: endTimestamp,
                    isActive: true // Default active
                }
            ]);

            if (error) {
                console.error("Supabase Save Error:", error);
                showToast("Election on Chain but DB save failed.", "error");
            } else {
                showToast("Election created successfully!", "success");
            }

            setShowCreateModal(false);
            fetchElections(); // Refresh from DB
        } catch (err) {
            console.error(err);
            showToast("Error creating election: " + (err.reason || err.message), "error");
        }
    };

    const handleManageElection = async (election) => {
        setSelectedElection(election);
        // Fetch positions for this election from Supabase
        try {
            const { data, error } = await supabase
                .from('positions')
                .select('*')
                .eq('election_id', election.id);
            if (error) throw error;
            setPositions(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPosition = async () => {
        if (!newPositionName) return;
        try {
            // 1. Add to Blockchain
            const tx = await contract.addPosition(selectedElection.id, newPositionName);
            await tx.wait();

            // 2. Add to Supabase
            // We should get the new ID.
            const posIds = await contract.getPositionIds(selectedElection.id);
            const newContractId = posIds[posIds.length - 1]; // Last added

            const { error } = await supabase.from('positions').insert([
                {
                    election_id: selectedElection.id,
                    contract_position_id: Number(newContractId),
                    name: newPositionName
                }
            ]);

            if (error) {
                console.error("Supabase Save Error:", error);
                showToast("Position added on chain but DB failed.", "error");
            } else {
                showToast("Position added successfully!", "success");
            }

            setNewPositionName('');
            handleManageElection(selectedElection); // Refresh positions
        } catch (err) {
            console.error(err);
            showToast("Error adding position", "error");
        }
    };

    const toggleStatus = async (electionId, currentStatus) => {
        // Prevent re-opening manually if it was closed
        if (!currentStatus) {
            return showToast("Cannot re-open a closed election for security reasons.", "error");
        }

        if (!window.confirm("Are you sure you want to END this election? This cannot be undone.")) {
            return;
        }

        try {
            // 1. Update Blockchain
            const nextStatus = !currentStatus;

            const tx = await contract.toggleElectionStatus(electionId, nextStatus);
            await tx.wait();

            // 2. Update Supabase
            const { error } = await supabase
                .from('elections')
                .update({ isActive: nextStatus })
                .eq('id', electionId);

            if (error) {
                console.error("Supabase Update Error:", error);
                showToast("Blockchain updated but DB failed.", "error");
            } else {
                // Success
                fetchElections(); // Reload list
                if (selectedElection && selectedElection.id === electionId) {
                    setSelectedElection({ ...selectedElection, isActive: nextStatus });
                }
                showToast(`Election Ended successfully!`, "success");
            }
        } catch (err) {
            console.error(err);
            showToast("Error updating status: " + (err.reason || err.message), "error");
        }
    }

    return (
        <div className="content-area">
            {!selectedElection ? (
                <>
                    {/* Main List View */}
                    <div className="page-header" style={{ marginBottom: '2rem' }}>
                        <div className="page-title">
                            <h2>Election Management</h2>
                            <p>Create and configure voting events.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} /> New Election
                        </button>
                    </div>

                    <div className="elections-grid">
                        {elections.map((el) => {
                            const now = Date.now() / 1000;
                            let status = 'Active';
                            let badgeClass = 'badge-active';

                            if (!el.isActive) {
                                status = 'Inactive';
                                badgeClass = 'badge-inactive';
                            } else if (now < el.startTime) {
                                status = 'Scheduled';
                                badgeClass = 'badge-pending';
                            } else if (now > el.endTime) {
                                status = 'Ended';
                                badgeClass = 'badge-ended';
                            }

                            return (
                                <div key={el.id} className="election-card glass-panel">
                                    <div className="card-top">
                                        <h3>{el.name}</h3>
                                        <span className={`status-pill ${badgeClass}`}>{status}</span>
                                    </div>

                                    <div className="date-info">
                                        <Calendar size={14} />
                                        <span>
                                            {new Date(el.startTime * 1000).toLocaleDateString()} - {new Date(el.endTime * 1000).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="stats-container">
                                        <div className="stat-box blue-border">
                                            <label>Candidates</label>
                                            <span className="stat-val blue-text">{el.candidateCount}</span>
                                        </div>
                                        <div className="stat-box purple-border">
                                            <label>Total Votes</label>
                                            <span className="stat-val purple-text">{el.voteCount}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        {el.isActive && status !== 'Ended' ? (
                                            <button
                                                className="action-btn btn-red"
                                                onClick={() => toggleStatus(el.id, el.isActive)}
                                            >
                                                <XCircle size={16} /> End Election
                                            </button>
                                        ) : (
                                            <button className="action-btn btn-disabled" disabled>
                                                Election Closed
                                            </button>
                                        )}

                                        <button
                                            className="action-btn btn-blue"
                                            onClick={() => handleManageElection(el)}
                                        >
                                            <Settings size={16} /> View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {elections.length === 0 && !loading && (
                            <div className="empty-state">
                                <p>No elections found. Create your first one!</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Detail / Manage View */
                <div className="manage-view animate-fade-in">
                    <button className="back-link" onClick={() => setSelectedElection(null)}>← Back to List</button>

                    <div className="manage-header glass-panel">
                        <div className="header-content">
                            <div>
                                <h1 style={{ marginBottom: '0.5rem' }}>{selectedElection.name}</h1>
                                {(() => {
                                    const now = Date.now() / 1000;
                                    let status = 'Live';
                                    let badgeClass = 'active';

                                    if (!selectedElection.isActive) {
                                        status = 'Closed';
                                        badgeClass = 'inactive';
                                    } else if (now < selectedElection.startTime) {
                                        status = 'Scheduled';
                                        badgeClass = 'pending'; // You might need to define 'pending' style if not global, but 'inactive' or specific class handles it
                                    } else if (now > selectedElection.endTime) {
                                        status = 'Ended';
                                        badgeClass = 'inactive';
                                    }

                                    return (
                                        <span className={`badge ${badgeClass}`}>
                                            {status}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="status-toggle">
                                {selectedElection.isActive ? (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => toggleStatus(selectedElection.id, selectedElection.isActive)}
                                        style={{ background: '#fecdd3', color: '#be123c', border: '1px solid #fecdd3' }}
                                    >
                                        {(Date.now() / 1000 > selectedElection.endTime) ? "Finalize & Close Election" : "End Election Permanently"}
                                    </button>
                                ) : (
                                    <button className="btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                        Election Closed
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="manage-grid">
                        {/* Positions Column */}
                        <div className="section-card glass-panel">
                            <h3>Positions</h3>
                            <div className="add-form">
                                <input
                                    type="text"
                                    placeholder="Enter position title (e.g. President)"
                                    value={newPositionName}
                                    onChange={(e) => setNewPositionName(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleAddPosition}>Add</button>
                            </div>
                            <ul className="list-group">
                                {positions.map(p => (
                                    <li key={p.id} className="list-item">
                                        <span>{p.name}</span>
                                        {/* Future: Add Delete button */}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Candidates Preview (Placeholder for next step) */}
                        <div className="section-card glass-panel">
                            <h3>Quick Stats</h3>
                            <p>Positions: {positions.length}</p>
                            <p>Total Candidates: --</p>
                            <small style={{ color: 'var(--text-muted)' }}>Manage candidates in the "Candidates" tab.</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h2>Create New Election</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateElection}>
                            <div className="form-group">
                                <label>Election Title</label>
                                <input required type="text" placeholder="e.g. 2024 General Elections" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input required type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input required type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Election</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
            .elections-grid {display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
            .election-card {padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-radius: 16px; border: 1px solid var(--border-color); background: white; transition: all 0.2s; }
            .election-card:hover {transform: translateY(-5px); box-shadow: var(--shadow-xl); }

            .card-top {display: flex; justify-content: space-between; align-items: flex-start; }
            .card-top h3 {margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main); line-height: 1.4; max-width: 70%; }

            .status-pill {padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-active {background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .badge-inactive {background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .badge-pending {background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .badge-ended {background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }

            .date-info {display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }

            .stats-container {display: flex; gap: 1rem; margin: 0.5rem 0; }
            .stat-box {flex: 1; border: 1px solid; border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
            .stat-box label {font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
            .stat-val {font-size: 1.4rem; font-weight: 700; }

            .blue-border {border-color: #bfdbfe; background: #eff6ff; }
            .blue-text {color: #2563eb; }

            .purple-border {border-color: #ddd6fe; background: #f5f3ff; }
            .purple-text {color: #7c3aed; }

            .card-actions {display: flex; gap: 0.75rem; margin-top: auto; }
            .action-btn {flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }

            .btn-red {background: #dc2626; color: white; }
            .btn-red:hover {background: #b91c1c; }

            .btn-blue {background: #2563eb; color: white; }
            .btn-blue:hover {background: #1d4ed8; }

            .btn-disabled {background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

            /* Modal & Other Styles inherited/preserved */
            .page-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
            .manage-view {animation: fadeIn 0.3s ease; }
            .back-link {background: none; border: none; color: var(--text-muted); margin-bottom: 1rem; cursor: pointer; padding: 0; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }

            /* Modal */
            .modal-overlay {position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .modal-content {width: 90%; max-width: 550px; padding: 2rem; border-radius: 24px; box-shadow: var(--shadow-xl); background: white; }
            .modal-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
            .close-btn {background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0; }

            .form-group {margin-bottom: 1.25rem; }
            .form-row {display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
            .modal-actions {display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }

            .manage-header {padding: 2rem; border-radius: 16px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
            .status-toggle {display: flex; align-items: center; gap: 1rem; }

            .manage-grid {display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
            .section-card {padding: 1.5rem; border-radius: 16px; }
            .add-form {display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
            .add-form input {flex: 1; padding: 0.75rem; border:1px solid var(--border-color); border-radius:8px;}
            .list-group {list-style: none; padding: 0; margin: 0; }
            .list-item {padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }

            @keyframes fadeIn {from {opacity: 0; transform: translateY(10px); } to {opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ElectionManager;
