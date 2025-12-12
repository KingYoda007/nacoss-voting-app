import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CandidateProtectedRoute = ({ children }) => {
    const { user, loginType, loading } = useAuth();

    if (loading) return <div className="loading-spinner"></div>;

    if (!user || loginType !== 'candidate') {
        return <Navigate to="/candidate/login" replace />;
    }

    return children;
};

export default CandidateProtectedRoute;
