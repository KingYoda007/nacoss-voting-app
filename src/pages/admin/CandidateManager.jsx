import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserPlus, Image, FileText, Search, Trash2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';

const CandidateManager = () => {
    const { provider, signer } = useContext(Web3Context);
    const { contract } = useContract(signer || provider);
    const { showToast } = useToast();

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
        try {
            const { data, error } = await supabase.from('elections').select('*').eq('isActive', true);
            if (error) throw error;
            setElections(data || []);
        } catch (err) {
            console.error("Fetch elections error:", err);
        }
    };

    const fetchPositions = async (electionId) => {
        try {
            const { data, error } = await supabase.from('positions').select('*').eq('election_id', electionId);
            if (error) throw error;
            setPositions(data || []);
        } catch (err) {
            console.error("Fetch positions error:", err);
        }
    };

    const fetchCandidates = async (electionId, posId) => {
        try {
            const { data, error } = await supabase.from('candidates').select('*').eq('position_id', posId);
            if (error) throw error;
            setCandidates(data || []);
        } catch (err) {
            console.error("Fetch candidates error:", err);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'candidate-photos' bucket
            const { error: uploadError } = await supabase.storage
                .from('candidate-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage.from('candidate-photos').getPublicUrl(filePath);

            setForm({ ...form, imageUrl: data.publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Error uploading image!', "error");
        } finally {
            setUploading(false);
        }
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();
        try {
            // Find contract_position_id
            const pos = positions.find(p => p.id == selectedPosition);
            if (!pos) return showToast("Position not found", "error");

            // 1. Add to Blockchain
            // Note: Contract addCandidate takes (positionId, name, info, image)
            // It assumes positionId is the contract's ID.
            const tx = await contract.addCandidate(pos.contract_position_id, form.name, form.info, form.imageUrl);
            await tx.wait();

            // 2. Add to Supabase
            // We need new Candidate ID from chain ideally, or fallback to auto-increment
            // For voting, we need the contract ID.
            // Let's count candidates for this pos on chain to guess the ID? 
            // Or assumes it's auto-increment logic: previous count + 1.
            const cIds = await contract.getCandidateIds(pos.contract_position_id);
            const newContractId = cIds[cIds.length - 1];

            const { error } = await supabase.from('candidates').insert([
                {
                    election_id: selectedElection,
                    position_id: selectedPosition,
                    contract_candidate_id: Number(newContractId),
                    name: form.name,
                    info: form.info,
                    ipfsImageUrl: form.imageUrl,
                    voteCount: 0
                }
            ]);

            if (error) console.error("Supabase Save Error:", error);

            showToast("Candidate registered successfully!", "success");
            setForm({ name: '', info: '', imageUrl: '' });
            fetchCandidates(selectedElection, selectedPosition);
        } catch (err) {
            console.error(err);
            showToast("Error adding candidate: " + (err.reason || err.message), "error");
        }
    };

    const handleDeleteCandidate = async (candidateId) => {
        if (!window.confirm("Are you sure you want to delete this candidate? This will remove them from the interface.")) return;

        try {
            const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
            if (error) throw error;

            // Refresh
            fetchCandidates(selectedElection, selectedPosition);
            showToast("Candidate deleted.", "success");
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Failed to delete candidate.", "error");
        }
    };

    return (
        <div className="content-area">
            <div className="page-header">
                <div className="page-title">
                    <h2>Candidate Registry</h2>
                    <p>Manage candidates for specific election positions.</p>
                </div>
            </div>

            <div className="candidate-layout">
                {/* Form Section */}
                <div className="form-card glass-panel">
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
                                    <label>Candidate Photo</label>
                                    <div className="input-icon">
                                        <Image size={16} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            style={{ paddingTop: '0.6rem' }}
                                        />
                                    </div>
                                    {uploading && <small style={{ color: 'var(--primary)', marginTop: '5px' }}>Uploading image...</small>}
                                </div>

                                {form.imageUrl && (
                                    <div className="image-preview">
                                        <img src={form.imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}

                                <button type="submit" className="btn-primary" disabled={uploading} style={{ width: '100%', marginTop: '1rem', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'Uploading...' : 'Add Candidate'}
                                </button>
                            </div>
                        )}

                        {!selectedPosition && selectedElection && <p className="hint-text">Please select a position to continue.</p>}
                    </form>
                </div>

                {/* List Section */}
                <div className="list-section">
                    <div className="list-header glass-panel">
                        <div className="search-bar">
                            <Search size={18} />
                            <input placeholder="Search candidate..." />
                        </div>
                        <span>{candidates.length} Registered</span>
                    </div>

                    <div className="candidates-grid">
                        {candidates.map(c => (
                            <div key={c.id} className="candidate-card glass-panel card-hover">
                                <img src={c.ipfsImageUrl} alt={c.name} className="candidate-img" />
                                <div className="candidate-info">
                                    <h4>{c.name}</h4>
                                    <p>{c.info}</p>
                                    <span className="badge active" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{c.voteCount} Votes</span>
                                </div>
                                <button className="delete-btn" onClick={() => handleDeleteCandidate(c.id)}><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {candidates.length === 0 && selectedPosition && (
                            <div className="empty-state">No candidates yet. Add one!</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .candidate-layout { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 2rem; }
                
                .form-card { padding: 2rem; border-radius: 16px; height: fit-content; }
                .form-group { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; }
                
                .select-input { width: 100%; }
                .input-icon { display: flex; align-items: center; gap: 0.5rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding-left: 0.8rem; color: var(--text-main); }
                .input-icon input { border: none; background: transparent; padding-left: 0; padding: 0.8rem 0; width: 100%; color: inherit; }
                .input-icon input:focus { outline: none; }
                
                .image-preview img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-top: 0.5rem; border: 1px solid var(--border-color); }
                .hint-text { font-size: 0.9rem; color: var(--text-muted); text-align: center; margin-top: 2rem; }

                .list-section { display: flex; flex-direction: column; gap: 1rem; }
                .list-header { padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .search-bar { display: flex; align-items: center; gap: 0.5rem; background: #ffffff; padding: 0.5rem 1rem; border-radius: 20px; width: 300px; border: 1px solid var(--border-color); }
                .search-bar input { background: transparent; border: none; color: var(--text-main); width: 100%; padding: 0; }
                .search-bar input:focus { outline: none; box-shadow: none; border: none; }

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
