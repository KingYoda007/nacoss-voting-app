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

// Web3
import { Web3Provider } from './context/Web3Context';
import { ToastProvider } from './context/ToastContext';

function App() {
    return (
        <ToastProvider>
            <Web3Provider>
                <Router>
                    <Routes>
                        {/* Public / Landing */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="overview" replace />} />
                            <Route path="overview" element={<Overview />} />
                            <Route path="elections" element={<ElectionManager />} />
                            <Route path="candidates" element={<CandidateManager />} />
                            <Route path="voters" element={<VoterManager />} />
                            <Route path="results" element={<AdminResults />} />
                        </Route>

                        {/* Voter Routes */}
                        <Route path="/voter" element={<VoterLayout />}>
                            <Route index element={<Navigate to="booth" replace />} />
                            <Route path="booth" element={<VotingBooth />} />
                            <Route path="history" element={<VoterHistory />} />
                            <Route path="results" element={<VoterResults />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </Web3Provider>
        </ToastProvider>
    );
}

export default App;
