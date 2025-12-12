import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import VoterLayout from './layouts/VoterLayout';
import LandingPage from './pages/LandingPage';
// Pages
import Overview from './pages/admin/Overview';
import ElectionManager from './pages/admin/ElectionManager';
import CandidateManager from './pages/admin/CandidateManager';
import VoterManager from './pages/admin/VoterManager';
import AdminResults from './pages/admin/AdminResults';
import VotingBooth from './pages/voter/VotingBooth';
import VoterHistory from './pages/voter/VoterHistory';

import VoterResults from './pages/voter/VoterResults';
import VoterProfile from './pages/voter/VoterProfile';

// Web3
import { Web3Provider } from './context/Web3Context';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <Web3Provider>
                    <Router>
                        <Routes>
                            {/* Public / Landing */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/admin/login" element={<AdminLogin />} />

                            {/* Admin Routes - Protected */}
                            <Route path="/admin" element={
                                <AdminProtectedRoute>
                                    <AdminLayout />
                                </AdminProtectedRoute>
                            }>
                                <Route index element={<Navigate to="overview" replace />} />
                                <Route path="overview" element={<Overview />} />
                                <Route path="elections" element={<ElectionManager />} />
                                <Route path="candidates" element={<CandidateManager />} />
                                <Route path="voters" element={<VoterManager />} />
                                <Route path="results" element={<AdminResults />} />
                            </Route>

                            {/* Voter Routes - Protected */}
                            <Route path="/voter" element={
                                <ProtectedRoute>
                                    <VoterLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Navigate to="booth" replace />} />
                                <Route path="booth" element={<VotingBooth />} />
                                <Route path="history" element={<VoterHistory />} />
                                <Route path="results" element={<VoterResults />} />
                                <Route path="profile" element={<VoterProfile />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Router>
                </Web3Provider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
