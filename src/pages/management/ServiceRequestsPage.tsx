/**
 * ServiceRequestsPage — Staff Management Dashboard
 *
 * Real-time service request management for hotel staff.
 * Features:
 *   - Status overview cards (Pending / In Progress / Completed)
 *   - Filterable/searchable request list
 *   - Quick status transition buttons
 *   - Socket.IO live updates
 *   - Responsive: phone → desktop
 *   - Dept-scoped roles auto-filter to their assigned department
 *
 * Time: O(n) render, Space: O(n) where n = page size
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useServiceRequestStore, ServiceRequest } from '../../stores/serviceRequestStore';
import { useAuthStore, isDepartmentScopedRole } from '../../stores/authStore';
import {
    Clock, CheckCircle2, Loader2, AlertCircle,
    RefreshCw, ChevronDown, ArrowRight, Bell, X,
    User, MapPin
} from 'lucide-react';
import clsx from 'clsx';
import io from 'socket.io-client';

/** Play a short audible beep for new/escalated service requests. Time: O(1) */
const playServiceAlertSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const now = ctx.currentTime;
        const beep = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.35, now + start);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };
        beep(660, 0, 0.12);
        beep(880, 0.18, 0.12);
        beep(660, 0.36, 0.18);
        setTimeout(() => ctx.close(), 700);
    } catch {
        // ignore
    }
};

// ── Status badge component ──
// Time: O(1), Space: O(1)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
        in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
        escalated: { bg: 'bg-red-50', text: 'text-red-700', label: 'Escalated' },
    };
    const c = config[status] || config.pending;
    return (
        <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', c.bg, c.text)}>
            {c.label}
        </span>
    );
};

// ── Request type label map (mirrored from backend) ──
const REQUEST_TYPE_LABELS: Record<string, string> = {
    need_towel: 'Need Towel',
    need_water: 'Need Water',
    room_cleaning: 'Room Cleaning',
    ac_not_working: 'AC Not Working',
    room_service: 'Room Service',
    plumbing_issue: 'Plumbing Issue',
    wifi_issue: 'WiFi Issue',
    extra_pillow: 'Extra Pillow/Blanket',
    laundry: 'Laundry Service',
    other: 'Other Request',
};

// ── Time ago helper ──
// Time: O(1), Space: O(1)
const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════

const ServiceRequestsPage: React.FC = () => {
    const {
        requests,
        stats,
        isLoadingRequests,
        isLoadingStats,
        fetchRequests,
        fetchStats,
        updateRequestStatus,
    } = useServiceRequestStore();

    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);

    // Dept-scoped roles: auto-filter to their department, no "All" option
    // Time: O(1)
    const isDeptScoped = isDepartmentScopedRole(user?.role || '');
    const userDeptName = user?.departmentId?.name || '';

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deptFilter, setDeptFilter] = useState<string>(
        isDeptScoped && userDeptName ? userDeptName : 'all'
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // ── DEBUG: direct fetch to prove API connectivity ──
    const [debugInfo, setDebugInfo] = useState<string>('Waiting...');
    useEffect(() => {
        const debugFetch = async () => {
            setDebugInfo('Fetching...');
            try {
                const resp = await fetch('http://localhost:5000/api/service-requests?page=1&limit=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await resp.json();
                setDebugInfo(`Status: ${resp.status} | Total: ${json?.data?.meta?.total ?? 'N/A'} | Requests: ${json?.data?.requests?.length ?? 0}`);
            } catch (err: unknown) {
                setDebugInfo(`FETCH ERROR: ${(err as Error).message}`);
            }
        };
        if (token) {
            debugFetch();
        } else {
            setDebugInfo('NO TOKEN - user not authenticated');
        }
    }, [token]);

    // Fetch data on mount.
    // For dept-scoped roles the backend handles filtering via departmentId from the JWT.
    // Do NOT send a department name param — it conflicts with the departmentId ObjectId filter.
    // For non-scoped roles, pass department name if a filter is active.
    // Time: O(1)
    useEffect(() => {
        console.log('[DEBUG ServiceRequestsPage] useEffect MOUNT - isDeptScoped:', isDeptScoped, 'userDeptName:', userDeptName, 'token:', !!token);
        fetchRequests();
        fetchStats({ department: isDeptScoped && userDeptName ? userDeptName : undefined });
    }, [fetchRequests, fetchStats, isDeptScoped, userDeptName]);

    // Track current filters via ref to avoid socket reconnect on filter change
    const filtersRef = React.useRef({ statusFilter, deptFilter });
    filtersRef.current = { statusFilter, deptFilter };

    // Socket.IO real-time updates — connects ONCE on mount, not on every filter change
    useEffect(() => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        const refetchWithCurrentFilters = () => {
            const { statusFilter: sf, deptFilter: df } = filtersRef.current;
            // Dept-scoped roles: backend handles dept filtering via auth, don't send name param
            const deptParam = !isDeptScoped && df !== 'all' ? df : undefined;
            fetchRequests({ status: sf !== 'all' ? sf : undefined, department: deptParam });
            fetchStats({ department: deptParam });
        };

        socket.on('new_service_request', () => {
            playServiceAlertSound();
            refetchWithCurrentFilters();
        });
        socket.on('request_status_changed', refetchWithCurrentFilters);
        socket.on('request_escalated', () => {
            playServiceAlertSound();
            refetchWithCurrentFilters();
        });

        return () => { socket.disconnect(); };
    }, [token, fetchRequests, fetchStats]);

    // Listen for push notification sound requests from the Service Worker.
    // Time: O(1) per message, Space: O(1)
    useEffect(() => {
        const handleSWMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') {
                playServiceAlertSound();
            }
            if (event.data?.type === 'NAVIGATE' && event.data?.url) {
                window.location.href = event.data.url;
            }
        };
        navigator.serviceWorker?.addEventListener('message', handleSWMessage);
        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
        };
    }, []);

    // Refresh handler
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        const deptParam = !isDeptScoped && deptFilter !== 'all' ? deptFilter : undefined;
        await Promise.all([
            fetchRequests({ status: statusFilter !== 'all' ? statusFilter : undefined, department: deptParam }),
            fetchStats({ department: deptParam }),
        ]);
        setIsRefreshing(false);
    }, [fetchRequests, fetchStats, statusFilter, deptFilter, isDeptScoped]);

    // Status change handler
    const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
        setUpdatingId(id);
        await updateRequestStatus(id, newStatus);
        await fetchStats();
        setUpdatingId(null);
    }, [updateRequestStatus, fetchStats]);

    // Filter change
    const handleFilterChange = useCallback((type: 'status' | 'dept', value: string) => {
        if (type === 'status') {
            setStatusFilter(value);
            const deptParam = !isDeptScoped && deptFilter !== 'all' ? deptFilter : undefined;
            fetchRequests({ status: value !== 'all' ? value : undefined, department: deptParam });
        } else {
            setDeptFilter(value);
            const deptParam = !isDeptScoped && value !== 'all' ? value : undefined;
            fetchRequests({ status: statusFilter !== 'all' ? statusFilter : undefined, department: deptParam });
            fetchStats({ department: deptParam });
        }
    }, [fetchRequests, fetchStats, statusFilter, deptFilter, isDeptScoped]);

    // Get unique departments from requests
    // Time: O(n), Space: O(d) where d = unique departments
    const departments = useMemo(() => {
        const depts = new Set(requests.map((r) => r.department));
        return Array.from(depts).sort();
    }, [requests]);

    // Server returns pre-filtered data via query params — no client-side filtering needed
    // Time: O(1) — just a reference alias

    const overview = stats?.overview || { total: 0, pending: 0, inProgress: 0, completed: 0, avgResponseTime: null };

    return (
        <div className="space-y-6">
            {/* ── DEBUG BANNER (REMOVE AFTER FIXING) ── */}
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-xl p-4 text-sm font-mono">
                <strong>🔍 DEBUG API TEST:</strong> {debugInfo}
                <br />
                <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'NONE'}
                <br />
                <strong>User:</strong> {user?.username || 'N/A'} | <strong>Role:</strong> {user?.role || 'N/A'} | <strong>Dept:</strong> {user?.departmentId?.name || 'N/A'}
                <br />
                <strong>Store requests:</strong> {requests.length} | <strong>isLoadingRequests:</strong> {String(isLoadingRequests)}
            </div>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary-dark">Service Requests</h1>
                    <p className="text-sm text-secondary mt-1">
                        {isDeptScoped && userDeptName
                            ? `${userDeptName} — Manage your department requests`
                            : 'Manage guest service requests in real-time'}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={clsx(
                        'inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl',
                        'hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm',
                        isRefreshing && 'opacity-70'
                    )}
                >
                    <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatsCard
                    label="Total"
                    value={overview.total}
                    icon={<Bell className="w-5 h-5" />}
                    color="blue"
                    loading={isLoadingStats}
                />
                <StatsCard
                    label="Pending"
                    value={overview.pending}
                    icon={<AlertCircle className="w-5 h-5" />}
                    color="amber"
                    loading={isLoadingStats}
                    onClick={() => handleFilterChange('status', statusFilter === 'pending' ? 'all' : 'pending')}
                    active={statusFilter === 'pending'}
                />
                <StatsCard
                    label="In Progress"
                    value={overview.inProgress}
                    icon={<Clock className="w-5 h-5" />}
                    color="indigo"
                    loading={isLoadingStats}
                    onClick={() => handleFilterChange('status', statusFilter === 'in_progress' ? 'all' : 'in_progress')}
                    active={statusFilter === 'in_progress'}
                />
                <StatsCard
                    label="Completed"
                    value={overview.completed}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="emerald"
                    loading={isLoadingStats}
                    onClick={() => handleFilterChange('status', statusFilter === 'completed' ? 'all' : 'completed')}
                    active={statusFilter === 'completed'}
                />
            </div>

            {/* Avg Response Time */}
            {overview.avgResponseTime !== null && (
                <div className="bg-surface rounded-xl px-4 py-3 border border-border flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-secondary">Avg. Response Time:</span>
                    <span className="text-sm font-semibold text-primary-dark">
                        {overview.avgResponseTime} min
                    </span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                {/* Department Filter — hidden for dept-scoped roles */}
                {!isDeptScoped && (
                    <div className="relative">
                        <select
                            value={deptFilter}
                            onChange={(e) => handleFilterChange('dept', e.target.value)}
                            aria-label="Filter by department"
                            className="appearance-none bg-surface border border-border rounded-xl pl-3 pr-8 py-2.5 text-sm text-primary-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="all">All Departments</option>
                            {departments.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
                    </div>
                )}

                {/* Active filter badges */}
                {(statusFilter !== 'all' || (!isDeptScoped && deptFilter !== 'all')) && (
                    <button
                        onClick={() => {
                            setStatusFilter('all');
                            const resetDept = isDeptScoped && userDeptName ? userDeptName : 'all';
                            setDeptFilter(resetDept);
                            fetchRequests({ department: resetDept !== 'all' ? resetDept : undefined });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Request List */}
            <div className="space-y-3">
                {isLoadingRequests ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                        <p className="text-secondary text-sm font-medium">No service requests found</p>
                        <p className="text-secondary/60 text-xs mt-1">New requests will appear here in real-time</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <RequestCard
                            key={req._id}
                            request={req}
                            onStatusChange={handleStatusChange}
                            isUpdating={updatingId === req._id}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════

/** Stats overview card. Time: O(1), Space: O(1) */
const StatsCard: React.FC<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
    onClick?: () => void;
    active?: boolean;
}> = ({ label, value, icon, color, loading, onClick, active }) => {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200',
        amber: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200',
        indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-200',
        emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200',
    };

    return (
        <div
            onClick={onClick}
            className={clsx(
                'bg-gradient-to-br rounded-xl p-4 border transition-all duration-200',
                colorMap[color] || colorMap.blue,
                onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                active && 'ring-2 ring-primary/30 shadow-md'
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="opacity-80">{icon}</span>
                {active && <div className="w-2 h-2 bg-primary rounded-full" />}
            </div>
            {loading ? (
                <div className="h-8 bg-white/50 rounded animate-pulse" />
            ) : (
                <p className="text-2xl md:text-3xl font-bold">{value}</p>
            )}
            <p className="text-xs font-medium opacity-70 mt-1">{label}</p>
        </div>
    );
};

/** Individual request card. Time: O(1), Space: O(1) */
const RequestCard: React.FC<{
    request: ServiceRequest;
    onStatusChange: (id: string, status: string) => void;
    isUpdating: boolean;
}> = ({ request, onStatusChange, isUpdating }) => {
    const nextStatus: Record<string, { label: string; value: string; color: string } | null> = {
        pending: { label: 'Start', value: 'in_progress', color: 'bg-blue-600 hover:bg-blue-700' },
        escalated: { label: 'Take Over', value: 'in_progress', color: 'bg-red-600 hover:bg-red-700' },
        in_progress: { label: 'Complete', value: 'completed', color: 'bg-emerald-600 hover:bg-emerald-700' },
        completed: null,
    };

    const next = nextStatus[request.status];
    const label = REQUEST_TYPE_LABELS[request.requestType] || request.requestType;

    return (
        <div className={clsx(
            'bg-surface border border-border rounded-xl p-4 md:p-5',
            'hover:shadow-sm transition-all duration-200',
            request.status === 'pending' && 'border-l-4 border-l-amber-400',
            request.status === 'escalated' && 'border-l-4 border-l-red-400',
            request.status === 'in_progress' && 'border-l-4 border-l-blue-400',
            request.status === 'completed' && 'border-l-4 border-l-emerald-400 opacity-75',
        )}>
            {/* Top Row: Room + Status */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold',
                        request.status === 'pending' ? 'bg-amber-500' :
                        request.status === 'escalated' ? 'bg-red-500' :
                        request.status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'
                    )}>
                        {request.guestInfo.roomNumber}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-primary-dark">{label}</p>
                        <p className="text-xs text-secondary">{request.department}</p>
                    </div>
                </div>
                <StatusBadge status={request.status} />
            </div>

            {/* Details Row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-secondary mb-3">
                {request.guestInfo.name && (
                    <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" /> {request.guestInfo.name}
                    </span>
                )}
                <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Room {request.guestInfo.roomNumber}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(request.createdAt)}
                </span>
            </div>

            {/* Custom message */}
            {request.customMessage && (
                <p className="text-xs text-secondary bg-background rounded-lg px-3 py-2 mb-3 italic">
                    &quot;{request.customMessage}&quot;
                </p>
            )}

            {/* Response time (if completed) */}
            {request.responseTimeMinutes !== undefined && request.status === 'completed' && (
                <p className="text-xs text-emerald-600 font-medium mb-3">
                    ✅ Resolved in {request.responseTimeMinutes} min
                </p>
            )}

            {/* Action Button */}
            {next && (
                <button
                    onClick={() => onStatusChange(request._id, next.value)}
                    disabled={isUpdating}
                    className={clsx(
                        'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                        'text-white text-sm font-medium transition-all',
                        next.color,
                        isUpdating && 'opacity-60'
                    )}
                >
                    {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <ArrowRight className="w-4 h-4" />
                            {next.label}
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default ServiceRequestsPage;
