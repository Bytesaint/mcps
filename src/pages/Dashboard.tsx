import React from 'react';
import { Smartphone, LayoutTemplate, FolderOpen, Plus, Wand2, ArrowRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useMock } from '../mock/MockContext';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
    const { phones, templates, projects } = useMock();
    const navigate = useNavigate();

    const stats = [
        { label: 'Phones Stored', value: phones.length, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Templates', value: templates.length, icon: LayoutTemplate, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Projects', value: projects.length, icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="flex items-center gap-4 transition-all hover:shadow-md">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Quick Actions</h3>
                    <p className="text-sm text-slate-500 mb-6">Common tasks to get you started</p>

                    <div className="space-y-3">
                        <Button
                            action={ACTIONS.MPCS_DASHBOARD_ADD_PHONE}
                            variant="secondary"
                            className="w-full justify-start h-12"
                            onClick={() => navigate('/phones')}
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                <Plus className="w-4 h-4" />
                            </div>
                            Add New Phone
                            <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                        </Button>

                        <Button
                            action={ACTIONS.MPCS_DASHBOARD_CREATE_TEMPLATE}
                            variant="secondary"
                            className="w-full justify-start h-12"
                            onClick={() => navigate('/templates')}
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-3">
                                <LayoutTemplate className="w-4 h-4" />
                            </div>
                            Create Template
                            <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                        </Button>

                        <Button
                            action={ACTIONS.MPCS_DASHBOARD_GENERATE_PROJECT}
                            variant="secondary"
                            className="w-full justify-start h-12"
                            onClick={() => navigate('/generate')}
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3">
                                <Wand2 className="w-4 h-4" />
                            </div>
                            Generate Project
                            <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                        </Button>
                    </div>
                </Card>

                <Card className="flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Recent Projects</h3>
                            <p className="text-sm text-slate-500">Latest generated comparisons</p>
                        </div>
                        <Button variant="secondary" action={ACTIONS.MPCS_NAV_PROJECTS} onClick={() => navigate('/projects')}>
                            View All
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {projects.slice(0, 3).map((project) => (
                            <div key={project.id} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100/50 text-emerald-600 flex items-center justify-center mr-4">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-slate-900">{project.name}</h4>
                                    <p className="text-xs text-slate-500">Created {project.dateCreated}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No projects yet
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
