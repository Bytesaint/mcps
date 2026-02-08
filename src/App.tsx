import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MockProvider } from './mock/MockContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Phones } from './pages/Phones';
import { Rules } from './pages/Rules';
import { Templates } from './pages/Templates';
import { Generate } from './pages/Generate';
import { Projects } from './pages/Projects';
import { Settings } from './pages/Settings';

function App() {
    return (
        <ToastProvider>
            <MockProvider>
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/phones" element={<Phones />} />
                            <Route path="/rules" element={<Rules />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/templates/builder" element={
                                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                        <span className="text-3xl font-bold">P2</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Visual Builder Coming Soon</h2>
                                    <p className="text-slate-500 max-w-md">Phase 2 will include a drag-and-drop template editor with live preview.</p>
                                    <p className="mt-8 text-xs text-slate-400">MPCS Phase 1 • UI Prototype</p>
                                </div>
                            } />
                            <Route path="/generate" element={<Generate />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:id" element={
                                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-500">
                                        <span className="text-3xl font-bold">View</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Project Details View</h2>
                                    <p className="text-slate-500 max-w-md">Detailed breakdown and export options will available in Phase 2.</p>
                                </div>
                            } />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </Router>
            </MockProvider>
        </ToastProvider>
    );
}

export default App;
