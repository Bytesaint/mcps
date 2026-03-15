import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppStoreProvider } from './store/appStore';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Phones } from './pages/Phones';
import { Rules } from './pages/Rules';
import { Templates } from './pages/Templates';
import { Generate } from './pages/Generate';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Settings } from './pages/Settings';
import { ensureSeedData } from './storage/seed';
import { initThemeListener } from './lib/theme';
import { EditorLayout } from './features/editor/EditorLayout';
import { applyAppearance } from './theme/applyTheme';
import { getAppearanceSetting } from './store/settingsStore';
import { TemplateBuilder } from './pages/TemplateBuilder';

// Initialize seed data on app load
ensureSeedData();

// Initialize theme
applyAppearance(getAppearanceSetting());
initThemeListener();

function App() {
    return (
        <ToastProvider>
            <AppStoreProvider>
                <Router>
                    <Routes>
                        <Route path="/templates/:templateId/builder" element={<TemplateBuilder />} />
                        <Route path="/templates/:templateId/builder/:pageId" element={<TemplateBuilder />} />
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/phones" element={<Phones />} />
                            <Route path="/rules" element={<Rules />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/generate" element={<Generate />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/editor/:projectId" element={<EditorLayout />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </Router>
            </AppStoreProvider>
        </ToastProvider>
    );
}

export default App;
