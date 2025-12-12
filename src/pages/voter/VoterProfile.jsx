import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { User, FileText, Hash, Layers, BookOpen, Camera, Save, Loader2 } from 'lucide-react';

const VoterProfile = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        full_name: '',
        matric_no: '',
        level: '',
        department: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                // 406 means no data returned (profile doesn't exist yet), which is fine
                throw error;
            }

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    matric_no: data.matric_no || '',
                    level: data.level || '',
                    department: data.department || '',
                    avatar_url: data.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // Don't toast on initial load error if it's just "not found"
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updates = {
                id: user.id,
                ...profile,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Error updating profile!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // We can reuse 'candidate-photos' or make a new 'avatars' bucket.
            // Using 'candidate-photos' for simplicity as permissions are set.
            const { error: uploadError } = await supabase.storage
                .from('candidate-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('candidate-photos').getPublicUrl(filePath);

            // Auto Update state
            setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
            showToast('Image uploaded!', 'success');

        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Error uploading image!', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="loading-state"><Loader2 className="spin" size={32} /></div>;
    }

    return (
        <div className="profile-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>Student Profile</h2>
                    <p>Manage your personal information</p>
                </div>
            </div>

            <div className="profile-card glass-panel">
                <form onSubmit={updateProfile} className="profile-form">

                    {/* Avatar Section */}
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <User size={48} />
                                </div>
                            )}
                            <label className="upload-btn">
                                <Camera size={18} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                    hidden
                                />
                            </label>
                        </div>
                        <div className="avatar-info">
                            <h3>{profile.full_name || 'Student Name'}</h3>
                            <p className="text-muted">{user?.email}</p>
                        </div>
                    </div>

                    <div className="divider"></div>

                    {/* Inputs */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-with-icon">
                                <User size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={profile.full_name}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Matric Number</label>
                            <div className="input-with-icon">
                                <Hash size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. COMP/2021/045"
                                    value={profile.matric_no}
                                    onChange={e => setProfile({ ...profile, matric_no: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Level</label>
                            <div className="input-with-icon">
                                <Layers size={18} />
                                <select
                                    value={profile.level}
                                    onChange={e => setProfile({ ...profile, level: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    <option value="100">100 Level</option>
                                    <option value="200">200 Level</option>
                                    <option value="300">300 Level</option>
                                    <option value="400">400 Level</option>
                                    <option value="500">500 Level</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Department</label>
                            <div className="input-with-icon">
                                <BookOpen size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. Computer Science"
                                    value={profile.department}
                                    onChange={e => setProfile({ ...profile, department: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>

            <style>{`
                .profile-page { max-width: 800px; margin: 0 auto; }
                .profile-card { padding: 3rem; border-radius: 20px; }
                
                .avatar-section { display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
                .avatar-wrapper { position: relative; width: 100px; height: 100px; }
                .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: var(--shadow-md); }
                .avatar-placeholder { width: 100px; height: 100px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; border: 3px solid white; box-shadow: var(--shadow-md); }
                
                .upload-btn { position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .upload-btn:hover { transform: scale(1.1); }
                
                .avatar-info h3 { margin: 0; font-size: 1.5rem; color: var(--text-main); }

                .divider { height: 1px; background: var(--border-color); margin: 0 0 2rem 0; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

                .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
                .input-with-icon { position: relative; }
                .input-with-icon svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
                .input-with-icon input, .input-with-icon select { padding-left: 3rem; width: 100%; box-sizing: border-box; }
                
                .form-actions { margin-top: 2rem; display: flex; justify-content: flex-end; }
                
                .loading-state { height: 50vh; display: flex; align-items: center; justify-content: center; color: var(--primary); }
            `}</style>
        </div>
    );
};

export default VoterProfile;
