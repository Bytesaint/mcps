import { Palette, Database, Shield, Moon, Sun, ArrowRight, Save } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

export function Settings() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSave = () => {
        toast("Settings saved (Simulated)", "success");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <Button action={ACTIONS.MPCS_SETTINGS_THEME_TOGGLE} onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Appearance */}
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                            <Palette className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Appearance</h3>
                            <p className="text-sm text-slate-500 mb-4">Customize the look and feel of the workspace.</p>

                            <div className="flex gap-4">
                                <div className="border-2 border-blue-500 rounded-lg p-4 w-32 cursor-pointer bg-blue-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sun className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-slate-900">Light</span>
                                    </div>
                                    <div className="h-2 w-16 bg-blue-200 rounded-full"></div>
                                </div>
                                <div className="border border-slate-200 rounded-lg p-4 w-32 cursor-pointer hover:border-blue-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Moon className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-500">Dark</span>
                                    </div>
                                    <div className="h-2 w-16 bg-slate-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Rules Admin */}
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Rules Administration</h3>
                            <p className="text-sm text-slate-500 mb-4">Manage global comparison rules and logic.</p>

                            <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_RULES_ADMIN} onClick={() => navigate('/rules')}>
                                Configure Rule Map <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Data Management */}
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
                            <Database className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Data Management</h3>
                            <p className="text-sm text-slate-500 mb-4">Import or export your phone database and templates.</p>

                            <div className="flex gap-3">
                                <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_DATA_IMPORT} disabled>
                                    Import Data (Phase 2)
                                </Button>
                                <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_DATA_EXPORT} disabled>
                                    Export JSON
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
