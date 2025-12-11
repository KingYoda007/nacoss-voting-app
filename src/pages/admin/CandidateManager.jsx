import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserPlus, Image, FileText, Search, Trash2 } from 'lucide-react';

const CandidateManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);

    const [elections, setElections] = useState([]);
    const [positions, setPositions] = useState([]);
    const [candidates, setCandidates] = useState([]);

    const [selectedElection, setSelectedElection] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');

    const [form, setForm] = useState({
        name: '',
        info: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (contract) fetchElections();
    }, [contract]);

    useEffect(() => {
        if (selectedElection) fetchPositions(selectedElection);
    }, [selectedElection]);

    useEffect(() => {
        if (selectedPosition) fetchCandidates(selectedElection, selectedPosition);
    }, [selectedPosition]);

    const fetchElections = async () => {
        const count = await contract.electionCounter();
        const loaded = [];
        for (let i = 1; i <= Number(count); i++) {
            const el = await contract.getElectionDetails(i);
            loaded.push({ id: i, name: el.name });
        }
        setElections(loaded);
    };

    const fetchPositions = async (electionId) => {
        const posIds = await contract.getPositionIds(electionId);
        const loaded = [];
        for (let id of posIds) {
            const p = await contract.getPosition(electionId, id);
            loaded.push({ id: Number(p.id), name: p.name });
        }
        setPositions(loaded);
    };

    const fetchCandidates = async (electionId, posId) => {
        const cIds = await contract.getCandidateIds(electionId, posId);
        const loaded = [];
        for (let id of cIds) {
            const c = await contract.getCandidate(electionId, posId, id);
            loaded.push({
                id: Number(c.id),
                name: c.name,
                info: c.info,
                ipfsImageUrl: c.ipfsImageUrl,
                voteCount: Number(c.voteCount)
            });
        }
        setCandidates(loaded);
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();
        try {
            const tx = await contract.addCandidate(selectedPosition, form.name, form.info, form.imageUrl);
            await tx.wait();
            alert("Candidate registered successfully!");
            setForm({ name: '', info: '', imageUrl: '' });
            fetchCandidates(selectedElection, selectedPosition);
        } catch (err) {
            console.error(err);
            alert("Error adding candidate");
        }
    };

    return (
        <div className="content-area">
            <div className="header-actions">
                <div>
                    <h2>Candidate Registry</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage candidates for specific election positions.</p>
                </div>
            </div>

            <div className="candidate-layout">
                {/* Form Section */}
                <div className="form-card glass">
                    <h3>Register New Candidate</h3>
                    <form onSubmit={handleAddCandidate}>
                        <div className="form-group">
                            <label>Select Election</label>
                            <select className="select-input" value={selectedElection} onChange={e => setSelectedElection(e.target.value)}>
                                <option value="">-- Choose Election --</option>
                                {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Position</label>
                            <select className="select-input" value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)} disabled={!selectedElection}>
                                <option value="">-- Choose Position --</option>
                                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {selectedPosition && (
                            <div className="animate-fade-in">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <div className="input-icon">
                                        <UserPlus size={16} />
                                        <input required placeholder="Candidate's legal name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Manifesto / Bio</label>
                                    <div className="input-icon">
                                        <FileText size={16} />
                                        <input required placeholder="Short bio or motto" value={form.info} onChange={e => setForm({ ...form, info: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Photo URL</label>
                                    <div className="input-icon">
                                        <Image size={16} />
                                        <input required placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                                    </div>
                                </div>

                                {form.imageUrl && (
                                    <div className="image-preview">
                                        <img src={form.imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}

                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                    Add Candidate
                                </button>
                            </div>
                        )}

                        {!selectedPosition && selectedElection && <p className="hint-text">Please select a position to continue.</p>}
                    </form>
                </div>

                {/* List Section */}
                <div className="list-section">
                    <div className="list-header glass">
                        <div className="search-bar">
                            <Search size={18} />
                            <input placeholder="Search candidate..." />
                        </div>
                        <span>{candidates.length} Registered</span>
                    </div>

                    <div className="candidates-grid">
                        {candidates.map(c => (
                            <div key={c.id} className="candidate-card glass">
                                <img src={c.ipfsImageUrl} alt={c.name} className="candidate-img" />
                                <div className="candidate-info">
                                    <h4>{c.name}</h4>
                                    <p>{c.info}</p>
                                    <span className="vote-badge">{c.voteCount} Votes</span>
                                </div>
                                <button className="delete-btn"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {candidates.length === 0 && selectedPosition && (
                            <div className="empty-state">No candidates yet. Add one!</div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .candidate-layout { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 2rem; }
                
                .form-card { padding: 2rem; border-radius: 16px; height: fit-content; }
                .form-group { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; }
                
                .select-input, .input-icon input { width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
                .input-icon { display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; padding-left: 0.8rem; }
                .input-icon input { border: none; background: transparent; padding-left: 0; }
                .input-icon input:focus { outline: none; }
                
                .image-preview img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-top: 0.5rem; border: 1px solid var(--border-color); }
                .hint-text { font-size: 0.9rem; color: var(--text-muted); text-align: center; margin-top: 2rem; }

                .list-section { display: flex; flex-direction: column; gap: 1rem; }
                .list-header { padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .search-bar { display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; border-radius: 20px; width: 300px; }
                .search-bar input { background: transparent; border: none; color: white; width: 100%; }
                .search-bar input:focus { outline: none; }

                .candidates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
                .candidate-card { padding: 1rem; border-radius: 12px; position: relative; display: flex; flex-direction: column; gap: 0.5rem; }
                .candidate-img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; }
                .candidate-info h4 { margin: 0; font-size: 1.1rem; }
                .candidate-info p { margin: 0; font-size: 0.85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .vote-badge { background: var(--accent); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; width: fit-content; margin-top: 0.5rem; }
                
                .delete-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; color: #ef4444; padding: 0.5rem; border-radius: 50%; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
                .candidate-card:hover .delete-btn { opacity: 1; }
            `}</style>
        </div>
    );
};

export default CandidateManager;
