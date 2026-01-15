// src/pages/management/ManagementLayout.tsx
import React, { useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Layers,
    HelpCircle,
    Users,
    CircleChevronLeft,
    LogOut,
    Menu,
    X,
    ListChecks,
    BarChart2,
    Building2,
    Settings,
    ChevronDown,
    FileText,
    Shield,
    type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Nav from '../../components/layout/Nav';
import clsx from 'clsx';
import { useFilterStore } from '../../stores/filterStore';

/**
 * Navigation item type
 */
interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

/**
 * Navigation group type
 */
interface NavGroup {
    title: string;
    icon: LucideIcon;
    items: NavItem[];
    defaultOpen?: boolean;
}

/**
 * Form Builder / Survey Settings navigation items
 */
const formBuilderItems: NavItem[] = [
    { href: '/management/questions', icon: HelpCircle, label: 'Questions' },
    { href: '/management/composites', icon: Layers, label: 'Composites' },
    { href: '/management/responses', icon: ListChecks, label: 'Yes/No Responses' },
    { href: '/management/report/low-rated-questions', icon: BarChart2, label: 'Low Rating Reports' },
];

/**
 * System Admin navigation items
 */
const systemAdminItems: NavItem[] = [
    { href: '/management/hotels', icon: Building2, label: 'Hotels' },
    { href: '/management/categories', icon: Layers, label: 'Categories' },
    { href: '/management/users', icon: Users, label: 'Users' },
    { href: '/management/settings', icon: Settings, label: 'Settings' },
];

/**
 * Navigation groups configuration
 */
const navGroups: NavGroup[] = [
    {
        title: 'Form Builder',
        icon: FileText,
        items: formBuilderItems,
        defaultOpen: true,
    },
    {
        title: 'System Admin',
        icon: Shield,
        items: systemAdminItems,
        defaultOpen: true,
    },
];

/**
 * Collapsible navigation group component
 */
interface NavGroupSectionProps {
    group: NavGroup;
    isOpen: boolean;
    onToggle: () => void;
    onLinkClick: () => void;
}

const NavGroupSection: React.FC<NavGroupSectionProps> = ({
    group,
    isOpen,
    onToggle,
    onLinkClick,
}) => {
    return (
        <div className="mb-2">
            {/* Group Header */}
            <button
                onClick={onToggle}
                className={clsx(
                    'w-full flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg',
                    'text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-accent/50'
                )}
                style={{ width: 'calc(100% - 16px)' }}
            >
                <div className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">
                        {group.title}
                    </span>
                </div>
                <ChevronDown
                    className={clsx(
                        'h-4 w-4 transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Group Items */}
            <div
                className={clsx(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="mt-1 space-y-1 pl-4">
                    {group.items.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={onLinkClick}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg',
                                    'text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-accent text-primary-dark shadow-sm'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                                )
                            }
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Management Layout Component
 * Provides navigation sidebar with grouped sections for Form Builder and System Admin
 */
const ManagementLayout: React.FC = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Track which groups are expanded
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        navGroups.forEach((group) => {
            initial[group.title] = group.defaultOpen ?? true;
        });
        return initial;
    });

    const { category, setCategory } = useFilterStore();

    const handleLogout = useCallback(() => {
        logout();
        setIsSidebarOpen(false);
        navigate('/login');
    }, [logout, navigate]);

    const handleLinkClick = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => !prev);
    }, []);

    const toggleGroup = useCallback((groupTitle: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupTitle]: !prev[groupTitle],
        }));
    }, []);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-surface shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="p-1.5 rounded-lg text-primary hover:bg-primary-50 transition-colors"
                        title="Back to Dashboard"
                    >
                        <CircleChevronLeft size={20} />
                    </Link>
                    <span className="text-lg font-semibold text-primary">Management</span>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
                <Nav category={category} setCategory={setCategory} />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Overlay (Mobile) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={clsx(
                        'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-primary shadow-xl',
                        'transition-transform duration-300 ease-out',
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                        'md:relative md:translate-x-0 md:shadow-lg md:rounded-2xl md:ml-3 md:my-3',
                        'md:h-[calc(100vh-88px)]'
                    )}
                >
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                onClick={handleLinkClick}
                                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                                title="Back to Dashboard"
                            >
                                <CircleChevronLeft size={20} />
                            </Link>
                            <h1 className="text-lg font-bold text-white">Management</h1>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg md:hidden transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Groups */}
                    <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                        {navGroups.map((group) => (
                            <NavGroupSection
                                key={group.title}
                                group={group}
                                isOpen={expandedGroups[group.title] ?? true}
                                onToggle={() => toggleGroup(group.title)}
                                onLinkClick={handleLinkClick}
                            />
                        ))}
                    </nav>

                    {/* Footer with Logout */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className={clsx(
                                'flex items-center gap-3 w-full px-4 py-3 rounded-lg',
                                'text-white/90 hover:text-white hover:bg-error/80',
                                'transition-all duration-200 font-medium'
                            )}
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManagementLayout;
