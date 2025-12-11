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
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setElections(data || []);
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
            // We need the blockchain ID for consistency, but for now we can just use mapping
            // Contract uses auto-increment ID per election.
            // Let's assume we can fetch the position ID or just re-fetch positions from chain to sync? 
            // Or simpler: Just insert name and election_id. Contract ID is needed for voting though.

            // To be precise: We should get the new ID.
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
        try {
            // 1. Update Blockchain
            const tx = await contract.toggleElectionStatus(electionId, !currentStatus);
            await tx.wait();

            // 2. Update Supabase
            const { error } = await supabase
                .from('elections')
                .update({ isActive: !currentStatus })
                .eq('id', electionId);

            if (error) {
                console.error("Supabase Update Error:", error);
                showToast("Blockchain updated but DB failed.", "error");
            } else {
                // Success
                fetchElections(); // Reload list
                if (selectedElection && selectedElection.id === electionId) {
                    setSelectedElection({ ...selectedElection, isActive: !currentStatus });
                }
                showToast(`Election ${!currentStatus ? 'Re-opened' : 'Ended'} successfully!`, "success");
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
                        {elections.map((el) => (
                            <div key={el.id} className="election-card glass-panel card-hover">
                                <div className="card-header">
                                    <span className={`badge ${el.isActive ? 'active' : 'inactive'}`}>
                                        {el.isActive ? 'Active' : 'Ended'}
                                    </span>
                                    <div className="actions">
                                        <button className="icon-btn" onClick={() => handleManageElection(el)}>
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <h3>{el.name}</h3>
                                    <div className="card-details">
                                        <div className="detail-row">
                                            <Calendar size={14} className="text-light" />
                                            <span>{new Date(el.startTime * 1000).toLocaleDateString()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <Clock size={14} className="text-light" />
                                            <span>{new Date(el.endTime * 1000).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="manage-btn" onClick={() => handleManageElection(el)}>
                                    Manage Configuration <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}

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
                                <span className={`badge ${selectedElection.isActive ? 'active' : 'inactive'}`}>
                                    {selectedElection.isActive ? 'Live' : 'Closed'}
                                </span>
                            </div>
                            <div className="status-toggle">
                                <button className="btn-secondary" onClick={() => toggleStatus(selectedElection.id, selectedElection.isActive)}>
                                    {selectedElection.isActive ? 'End Election' : 'Re-open Election'}
                                </button>
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
                .elections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .election-card { padding: 0; display: flex; flex-direction: column; overflow: hidden; height: 100%; min-height: 220px; }
                
                .card-header { padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; }
                .card-content { px: 1.25rem; padding-bottom: 3.5rem; padding-left: 1.25rem; padding-right: 1.25rem; flex: 1; }
                .card-content h3 { font-size: 1.25rem; margin-bottom: 0.75rem; }

                .card-details { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-muted); }
                .detail-row { display: flex; align-items: center; gap: 0.5rem; }
                .text-light { color: var(--text-light); }

                .manage-btn { 
                    margin-top: auto; 
                    background: rgba(248, 250, 252, 0.5); 
                    color: var(--primary); 
                    border: none; 
                    border-top: 1px solid var(--border-color);
                    padding: 1rem; 
                    width: 100%; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    cursor: pointer; 
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .manage-btn:hover { background: var(--bg-main); color: var(--primary-dark); }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { width: 90%; max-width: 550px; padding: 2rem; border-radius: 24px; box-shadow: var(--shadow-xl); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .close-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0; }
                
                .form-group { margin-bottom: 1.25rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }

                /* Manage View */
                .manage-view { animation: fadeIn 0.3s ease; }
                .back-link { background: none; border: none; color: var(--text-muted); margin-bottom: 1rem; cursor: pointer; padding: 0; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
                .back-link:hover { color: var(--primary); }
                
                .manage-header { padding: 2rem; border-radius: 16px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
                .status-toggle { display: flex; align-items: center; gap: 1rem; }
                
                .manage-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
                .section-card { padding: 1.5rem; border-radius: var(--radius); }
                .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
                .add-form input { flex: 1; }
                .list-group { list-style: none; padding: 0; margin: 0; }
                .list-item { padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
                .list-item:last-child { border-bottom: none; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ElectionManager;
