import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const AdminProtectedRoute = ({ children }) => {
    const { user, loading, loginType } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <ShieldCheck className="spin" size={40} color="var(--primary)" />
            </div>
        );
    }

    // STRICT CHECK: Must be logged in AND have 'admin' login type
    if (!user || loginType !== 'admin') {
        // Redirect to specialized Admin Login instead of generic home
        return <Navigate to="/admin/login" replace />;
    }

    // Note: We also relay on AdminLayout's existing wallet check for "double security"
    return children;
};

export default AdminProtectedRoute;
