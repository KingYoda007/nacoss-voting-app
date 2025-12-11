import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Plus, Calendar, Clock, CheckCircle, XCircle, ArrowRight, Settings } from 'lucide-react';
import { ethers } from 'ethers';

const ElectionManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract();

    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({ name: '', startDate: '', startTime: '', endDate: '', endTime: '' });

    // Election Details Modal / View State
    const [selectedElection, setSelectedElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [newPositionName, setNewPositionName] = useState('');

    useEffect(() => {
        if (contract) fetchElections();
        else setLoading(false); // Stop loading if no contract
    }, [contract]);

    const fetchElections = async () => {
        if (!contract) return;
        try {
            setLoading(true);
            const count = await contract.electionCounter();
            const loaded = [];
            for (let i = 1; i <= Number(count); i++) {
                const el = await contract.getElectionDetails(i);
                loaded.push({
                    id: i,
                    name: el.name,
                    startTime: Number(el.startTime),
                    endTime: Number(el.endTime),
                    isActive: el.isActive
                });
            }
            setElections(loaded);
        } catch (err) {
            console.error("Fetch elections error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateElection = async (e) => {
        e.preventDefault();
        if (!contract) {
            return alert("Wallet not connected! Please connect your wallet first.");
        }
        try {
            const startTimestamp = Math.floor(new Date(`${form.startDate}T${form.startTime}`).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(`${form.endDate}T${form.endTime}`).getTime() / 1000);

            const tx = await contract.createElection(form.name, startTimestamp, endTimestamp);
            await tx.wait();
            setShowCreateModal(false);
            fetchElections(); // Refresh list
        } catch (err) {
            console.error(err);
            alert("Error creating election: " + (err.reason || err.message));
        }
    };

    const handleManageElection = async (election) => {
        setSelectedElection(election);
        // Fetch positions for this election
        try {
            const posIds = await contract.getPositionIds(election.id);
            const loadedPos = [];
            for (let id of posIds) {
                const p = await contract.getPosition(election.id, id);
                loadedPos.push({ id: Number(p.id), name: p.name });
            }
            setPositions(loadedPos);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPosition = async () => {
        if (!newPositionName) return;
        try {
            const tx = await contract.addPosition(selectedElection.id, newPositionName);
            await tx.wait();
            setNewPositionName('');
            handleManageElection(selectedElection); // Refresh positions
        } catch (err) {
            console.error(err);
            alert("Error adding position");
        }
    };

    const toggleStatus = async (electionId, currentStatus) => {
        try {
            const tx = await contract.toggleElectionStatus(electionId, !currentStatus);
            await tx.wait();
            fetchElections();
            if (selectedElection && selectedElection.id === electionId) {
                setSelectedElection({ ...selectedElection, isActive: !currentStatus });
            }
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="content-area">
            {!selectedElection ? (
                <>
                    {/* Main List View */}
                    <div className="header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <h2>Election Management</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Create and configure voting events.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} /> New Election
                        </button>
                    </div>

                    <div className="elections-grid">
                        {elections.map((el) => (
                            <div key={el.id} className="election-card glass">
                                <div className="card-header">
                                    <span className={`status-badge ${el.isActive ? 'active' : 'inactive'}`}>
                                        {el.isActive ? 'Active' : 'Ended'}
                                    </span>
                                    <div className="actions">
                                        <button className="icon-btn" onClick={() => handleManageElection(el)}>
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3>{el.name}</h3>
                                <div className="card-details">
                                    <div className="detail-row">
                                        <Calendar size={14} />
                                        <span>{new Date(el.startTime * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Clock size={14} />
                                        <span>{new Date(el.endTime * 1000).toLocaleTimeString()}</span>
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

                    <div className="manage-header glass">
                        <div className="header-content">
                            <h1>{selectedElection.name}</h1>
                            <div className="status-toggle">
                                <span className={`status-text ${selectedElection.isActive ? 'text-green' : 'text-red'}`}>
                                    {selectedElection.isActive ? 'Live' : 'Closed'}
                                </span>
                                <button className="btn-outline" onClick={() => toggleStatus(selectedElection.id, selectedElection.isActive)}>
                                    {selectedElection.isActive ? 'End Election' : 'Re-open Election'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="manage-grid">
                        {/* Positions Column */}
                        <div className="section-card glass">
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
                        <div className="section-card glass">
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
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <h2>Create New Election</h2>
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
                                <button type="button" className="btn-text" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Election</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .elections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .election-card { padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1rem; transition: transform 0.2s; }
                .election-card:hover { transform: translateY(-3px); }
                
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.active { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .status-badge.inactive { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .card-details { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-muted); }
                .detail-row { display: flex; align-items: center; gap: 0.5rem; }

                .manage-btn { margin-top: auto; background: rgba(255,255,255,0.05); color:white; border:none; padding: 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
                .manage-btn:hover { background: rgba(255,255,255,0.1); }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: #0f172a; padding: 2rem; border-radius: 16px; width: 90%; max-width: 500px; border: 1px solid var(--border-color); }
                .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 8px; color: white; }
                input:focus { outline: none; border-color: var(--accent); }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
                .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                /* Manage View */
                .manage-view { animation: fadeIn 0.3s ease; }
                .back-link { background: none; border: none; color: var(--accent); margin-bottom: 1rem; cursor: pointer; padding: 0; }
                .manage-header { padding: 2rem; border-radius: 16px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
                .status-toggle { display: flex; align-items: center; gap: 1rem; }
                .btn-outline { background: transparent; border: 1px solid var(--border-color); color: white; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
                
                .manage-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
                .section-card { padding: 1.5rem; border-radius: 16px; }
                .add-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
                .add-form input { flex: 1; }
                .list-group { list-style: none; padding: 0; margin: 0; }
                .list-item { padding: 0.8rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; }
                .list-item:last-child { border-bottom: none; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ElectionManager;
