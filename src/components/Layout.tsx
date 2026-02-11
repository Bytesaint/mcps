import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Scale, LayoutTemplate, Wand2, FolderOpen, Settings, Bell, Search, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ACTIONS } from '../actionMap';

export function Layout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, action: ACTIONS.MPCS_NAV_DASHBOARD },
        { name: 'Phones', path: '/phones', icon: Smartphone, action: ACTIONS.MPCS_NAV_PHONES },
        { name: 'Rule Map', path: '/rules', icon: Scale, action: ACTIONS.MPCS_NAV_RULES },
        { name: 'Templates', path: '/templates', icon: LayoutTemplate, action: ACTIONS.MPCS_NAV_TEMPLATES },
        { name: 'Generate', path: '/generate', icon: Wand2, action: ACTIONS.MPCS_NAV_GENERATE },
        { name: 'Projects', path: '/projects', icon: FolderOpen, action: ACTIONS.MPCS_NAV_PROJECTS },
        { name: 'Settings', path: '/settings', icon: Settings, action: ACTIONS.MPCS_NAV_SETTINGS },
    ];

    const getPageTitle = () => {
        const current = navItems.find(item => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path)));
        return current ? current.name : 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop & Mobile) */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3">M</div>
                        <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">MPCS</span>
                    </div>
                    <button
                        className="md:hidden text-slate-400 hover:text-slate-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            data-action={item.action}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5 mr-3 opacity-75" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="text-xs text-slate-400 font-medium">MPCS • Phase 2B Preview</div>
                    <div className="text-[10px] text-slate-300 dark:text-slate-500 mt-1">v0.2.0 • Phase 2B</div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col w-full">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <h1 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white truncate">{getPageTitle()}</h1>
                        <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800 capitalize">
                            Phase 2B Preview
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 w-64 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <button className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer">
                            JD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-950 flex flex-col min-h-0">
                    <div className="flex-1 w-full flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
