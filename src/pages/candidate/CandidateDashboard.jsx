import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { Image, FileText, Save, Activity, Trophy, BarChart2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [form, setForm] = useState({
        info: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (user?.email) fetchCandidateProfile();
    }, [user]);

    const fetchCandidateProfile = async () => {
        try {
            setRefreshing(true);
            const { data, error } = await supabase
                .from('candidates')
                .select('*, positions(name), elections(name, isActive, endTime)')
                .eq('email', user.email)
                .single();

            if (error) throw error;
            setCandidate(data);

            // Only set form on initial load
            if (loading) {
                setForm({
                    info: data.info || '',
                    imageUrl: data.ipfsImageUrl || ''
                });
            }
        } catch (error) {
            console.error("Error fetching candidate:", error);
            showToast("Could not load candidate profile.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('candidates')
                .update({
                    info: form.info,
                    ipfsImageUrl: form.imageUrl
                })
                .eq('id', candidate.id);

            if (error) throw error;
            showToast("Profile updated successfully!", "success");
            fetchCandidateProfile(); // Refresh
        } catch (err) {
            console.error(err);
            showToast("Failed to update profile.", "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `cand_${candidate.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('candidate-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('candidate-photos').getPublicUrl(filePath);
            setForm(prev => ({ ...prev, imageUrl: data.publicUrl }));
        } catch (err) {
            console.error(err);
            showToast("Image upload failed.", "error");
        }
    };

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;
    if (!candidate) return <div className="error-message">Candidate profile not found. Contact Admin.</div>;

    const isElectionActive = candidate.elections?.isActive;

    return (
        <div className="content-area animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h2>Welcome, {candidate.name}</h2>
                    <p>Manage your campaign and track your progress.</p>
                </div>
                <button
                    className="btn-secondary"
                    onClick={fetchCandidateProfile}
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh Stats
                </button>
            </div>

            {/* 1. Stats Row - Horizontal Cards */}
            <div className="stats-row">
                {/* Vote Count Card */}
                <div className="stat-card glass-panel">
                    <div className="icon-wrapper blue">
                        <Activity size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>{candidate.voteCount}</h3>
                        <p>Total Votes Received</p>
                    </div>
                </div>

                {/* Position Card */}
                <div className="stat-card glass-panel">
                    <div className="icon-wrapper purple">
                        <Trophy size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>{candidate.positions?.name}</h3>
                        <p>{candidate.elections?.name}</p>
                    </div>
                </div>

                {/* Action Card (Results) */}
                <Link to="/voter/results" className="stat-card glass-panel hover-scale link-card">
                    <div className="icon-wrapper green">
                        <BarChart2 size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>View Results</h3>
                        <p>Check Official Tally</p>
                    </div>
                </Link>
            </div>

            {/* 2. Main Grid: Profile & Preview */}
            <div className="main-grid">
                {/* Left: Edit Profile */}
                <div className="profile-section glass-panel">
                    <div className="section-header">
                        <h3><FileText size={20} /> Edit Manifesto</h3>
                        <p>Update your bio and photo to attract voters.</p>
                    </div>

                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label>Campaign Photo</label>
                            <div className="media-picker">
                                <img
                                    src={form.imageUrl || 'https://via.placeholder.com/150'}
                                    alt="Preview"
                                    className="preview-thumb"
                                />
                                <div className="picker-actions">
                                    <label className="btn-secondary file-btn">
                                        <Image size={16} /> Choose Image
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                    <small>Square format looks best.</small>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Manifesto / Bio</label>
                            <textarea
                                value={form.info}
                                onChange={e => setForm({ ...form, info: e.target.value })}
                                placeholder="I promise to..."
                                rows={6}
                                className="bio-input"
                            />
                        </div>

                        <button type="submit" className="btn-primary full-width" disabled={updating}>
                            <Save size={18} /> {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Right: Voter Preview */}
                <div className="preview-section glass-panel">
                    <div className="section-header">
                        <h3><Activity size={20} /> Voter's View</h3>
                        <p>This is how you appear on the ballot.</p>
                    </div>

                    <div className="preview-container">
                        <div className="voter-card-mockup">
                            <img src={form.imageUrl || 'https://via.placeholder.com/150'} alt={candidate.name} />
                            <div className="mockup-content">
                                <h4>{candidate.name}</h4>
                                <p className="limit-text">{form.info || "No manifesto provided yet..."}</p>
                                <button className="mockup-btn" disabled>Vote</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .content-area { max-width: 1200px; margin: 0 auto; padding: 2rem; }
                .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .dashboard-header h2 { font-size: 1.8rem; margin: 0; }
                .dashboard-header p { color: var(--text-muted); margin: 0.5rem 0 0 0; }

                /* Stats Row */
                .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { display: flex; align-items: center; padding: 1.5rem; gap: 1rem; border-radius: 16px; transition: transform 0.2s; }
                .link-card { text-decoration: none; color: inherit; border: 1px solid var(--border-color); }
                .link-card:hover { border-color: var(--primary); }

                .icon-wrapper { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

                .stat-content h3 { font-size: 1.6rem; margin: 0; font-weight: 700; color: var(--text-main); }
                .stat-content p { margin: 0; color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem; }

                /* Main Grid */
                .main-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
                @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
                
                .section-header { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .section-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; }
                .section-header p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

                .profile-section, .preview-section { padding: 2rem; border-radius: 16px; }

                /* Form Styles */
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; margin-bottom: 0.8rem; font-weight: 500; color: var(--text-main); }
                
                .media-picker { display: flex; gap: 1.5rem; align-items: center; }
                .preview-thumb { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 2px solid var(--border-color); }
                .picker-actions { display: flex; flex-direction: column; gap: 0.5rem; }
                .file-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; border-radius: 8px; font-size: 0.9rem; }
                
                .bio-input { width: 100%; padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.5); font-family: inherit; resize: vertical; outline: none; transition: all 0.2s; }
                .bio-input:focus { border-color: var(--primary); background: white; }

                /* Preview Card */
                .preview-container { display: flex; justify-content: center; background: #f8fafc; padding: 2rem; border-radius: 12px; }
                .voter-card-mockup { background: white; width: 100%; max-width: 280px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; flex-direction: column; border: 1px solid var(--border-color); }
                .voter-card-mockup img { width: 100%; height: 200px; object-fit: cover; }
                .mockup-content { padding: 1.5rem; text-align: left; }
                .mockup-content h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
                .limit-text { color: var(--text-muted); font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 1rem; }
                .mockup-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 0.5rem; border-radius: 8px; opacity: 0.5; cursor: default; }

                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default CandidateDashboard;
