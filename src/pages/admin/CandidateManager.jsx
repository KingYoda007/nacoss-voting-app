import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useContract } from '../../hooks/useContract';
import { UserPlus, Image, FileText, Search, Trash2, Mail, Edit2 } from 'lucide-react';
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
        email: '',
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
            const { data, error } = await supabase.from('elections').select('*').order('id', { ascending: false });
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
                    email: form.email,
                    info: form.info,
                    ipfsImageUrl: form.imageUrl,
                    voteCount: 0
                }
            ]);

            if (error) console.error("Supabase Save Error:", error);

            showToast("Candidate registered successfully!", "success");
            setForm({ name: '', email: '', info: '', imageUrl: '' });
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
                                    <label>Email Address</label>
                                    <div className="input-icon">
                                        <Mail size={16} />
                                        <input type="email" required placeholder="Candidate's login email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
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
                        <h3>Added Candidates ({candidates.length})</h3>
                        <div className="search-bar">
                            <Search size={16} />
                            <input placeholder="Search..." />
                        </div>
                    </div>

                    <div className="candidates-list">
                        {candidates.map(c => (
                            <div key={c.id} className="candidate-item glass-panel">
                                <div className="c-avatar">
                                    <img src={c.ipfsImageUrl || 'https://via.placeholder.com/80'} alt={c.name} />
                                </div>
                                <div className="c-info">
                                    <h4>{c.name}</h4>
                                    <span className="c-pos">{positions.find(p => p.id === c.position_id)?.name || 'Unknown Position'}</span>
                                    <small className="c-email">{c.email}</small>
                                </div>
                                <div className="c-actions">
                                    {/* Placeholder Edit */}
                                    <button className="icon-btn-sm edit" title="Edit"><Edit2 size={16} /></button>
                                    <button className="icon-btn-sm delete" onClick={() => handleDeleteCandidate(c.id)} title="Delete"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {candidates.length === 0 && (
                            <div className="empty-state">
                                <p>No candidates found. Select a position to add some.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .content-area { max-width: 1200px; margin: 0 auto; padding: 2rem; }
                .candidate-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; margin-top: 1rem; }
                
                .form-card { padding: 2rem; border-radius: 16px; background: white; border: 1px solid var(--border-color); }
                .form-card h3 { margin-bottom: 1.5rem; font-size: 1.25rem; }
                
                .form-group { margin-bottom: 1.25rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
                
                .select-input, .input-icon { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: #fff; font-size: 0.95rem; }
                .input-icon { display: flex; align-items: center; gap: 0.75rem; padding-left: 1rem; }
                .input-icon input { border: none; outline: none; width: 100%; font-size: 0.95rem; }
                
                .list-section { display: flex; flex-direction: column; gap: 1rem; }
                .list-header { padding: 1rem 1.5rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
                .list-header h3 { margin: 0; font-size: 1.1rem; }
                
                .search-bar { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 99px; width: 200px; }
                .search-bar input { background: transparent; border: none; outline: none; font-size: 0.9rem; width: 100%; }

                .candidates-list { display: flex; flex-direction: column; gap: 1rem; }
                .candidate-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); transition: all 0.2s; }
                .candidate-item:hover { border-color: var(--primary-light); background: #f8fafc; }
                
                .c-avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; border: 2px solid var(--border-color); flex-shrink: 0; }
                .c-avatar img { width: 100%; height: 100%; object-fit: cover; }
                
                .c-info { flex: 1; }
                .c-info h4 { margin: 0 0 0.2rem 0; font-size: 1rem; color: var(--text-main); }
                .c-pos { display: block; font-size: 0.85rem; color: var(--primary); font-weight: 500; }
                .c-email { display: block; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.1rem; }

                .c-actions { display: flex; gap: 0.5rem; }
                .icon-btn-sm { width: 32px; height: 32px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .icon-btn-sm.edit { background: #eff6ff; color: #2563eb; }
                .icon-btn-sm.edit:hover { background: #dbeafe; }
                .icon-btn-sm.delete { background: #fef2f2; color: #ef4444; }
                .icon-btn-sm.delete:hover { background: #fee2e2; }

                .image-preview img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-top: 0.5rem; border: 1px solid var(--border-color); }
                .hint-text { text-align: center; color: var(--text-muted); margin-top: 2rem; }
                
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default CandidateManager;
