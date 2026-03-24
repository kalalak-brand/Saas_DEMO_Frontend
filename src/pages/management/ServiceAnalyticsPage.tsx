/**
 * ServiceAnalyticsPage — Staff dashboard for service request performance
 *
 * Displays:
 *   - Overview stats (total, avg response time, satisfaction)
 *   - Department performance breakdown
 *   - Request type distribution
 *   - Date range filtering
 *
 * Responsive: phone → desktop
 * Time: O(n) data fetch, Space: O(d) departments
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useServiceRequestStore } from '../../stores/serviceRequestStore';
import {
    Clock, CheckCircle2, Loader2, BarChart3,
    TrendingUp, Star, RefreshCw, Calendar, Bell
} from 'lucide-react';
import clsx from 'clsx';

const ServiceAnalyticsPage: React.FC = () => {
    const { stats, isLoadingStats, fetchStats } = useServiceRequestStore();
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchStats({
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined,
        });
        setIsRefreshing(false);
    }, [fetchStats, dateRange]);

    const handleDateFilter = useCallback(() => {
        fetchStats({
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined,
        });
    }, [fetchStats, dateRange]);

    const overview = stats?.overview || {
        total: 0, pending: 0, inProgress: 0, completed: 0,
        avgResponseTime: null, avgFeedbackRating: null,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary-dark">Service Analytics</h1>
                    <p className="text-sm text-secondary mt-1">Performance insights for service requests</p>
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

            {/* Date Range Filter */}
            <div className="bg-surface rounded-xl p-4 border border-border flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">From</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                        className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">To</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                        className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    onClick={handleDateFilter}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    Apply
                </button>
            </div>

            {/* Loading */}
            {isLoadingStats ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <AnalyticsCard
                            label="Total Requests"
                            value={overview.total.toString()}
                            icon={<Bell className="w-5 h-5" />}
                            color="blue"
                        />
                        <AnalyticsCard
                            label="Completed"
                            value={`${overview.completed}`}
                            subtitle={overview.total > 0
                                ? `${Math.round((overview.completed / overview.total) * 100)}% completion`
                                : undefined}
                            icon={<CheckCircle2 className="w-5 h-5" />}
                            color="emerald"
                        />
                        <AnalyticsCard
                            label="Avg Response"
                            value={overview.avgResponseTime !== null ? `${overview.avgResponseTime} min` : '—'}
                            icon={<Clock className="w-5 h-5" />}
                            color="amber"
                        />
                        <AnalyticsCard
                            label="Satisfaction"
                            value={overview.avgFeedbackRating !== null ? `${overview.avgFeedbackRating}/5` : '—'}
                            icon={<Star className="w-5 h-5" />}
                            color="purple"
                        />
                    </div>

                    {/* Department Performance */}
                    {stats?.byDepartment && stats.byDepartment.length > 0 && (
                        <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                <h3 className="text-base font-semibold text-primary-dark">Department Performance</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {stats.byDepartment.map((dept) => {
                                    const completionRate = dept.total > 0
                                        ? Math.round((dept.completed / dept.total) * 100) : 0;
                                    return (
                                        <div key={dept._id} className="px-5 py-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-primary-dark">{dept._id}</span>
                                                <span className="text-xs text-secondary">{dept.total} requests</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="h-2 bg-border rounded-full overflow-hidden mb-2">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${completionRate}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-secondary">
                                                <span>{completionRate}% completed</span>
                                                <span>{dept.pending} pending</span>
                                                {dept.avgResponseTime !== null && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.round(dept.avgResponseTime)} min avg
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Request Type Distribution */}
                    {stats?.byRequestType && stats.byRequestType.length > 0 && (
                        <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <h3 className="text-base font-semibold text-primary-dark">Request Types</h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-3">
                                    {stats.byRequestType.map((rt) => {
                                        const maxCount = Math.max(...stats.byRequestType.map((r) => r.count), 1);
                                        const percentage = Math.round((rt.count / maxCount) * 100);
                                        return (
                                            <div key={rt._id} className="flex items-center gap-3">
                                                <span className="text-sm text-primary-dark font-medium w-36 sm:w-44 truncate">
                                                    {rt.label}
                                                </span>
                                                <div className="flex-1 h-6 bg-border/50 rounded-lg overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                                                        style={{ width: `${Math.max(percentage, 8)}%` }}
                                                    >
                                                        <span className="text-[10px] font-bold text-white">{rt.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {overview.total === 0 && (
                        <div className="text-center py-16">
                            <BarChart3 className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                            <p className="text-secondary text-sm font-medium">No service request data yet</p>
                            <p className="text-secondary/60 text-xs mt-1">Analytics will appear once guests start making requests</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/** Analytics overview card */
const AnalyticsCard: React.FC<{
    label: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}> = ({ label, value, subtitle, icon, color }) => {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200',
        emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200',
        amber: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200',
        purple: 'from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-200',
    };

    return (
        <div className={clsx(
            'bg-gradient-to-br rounded-xl p-4 border',
            colorMap[color] || colorMap.blue
        )}>
            <div className="flex items-center justify-between mb-2">
                <span className="opacity-80">{icon}</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-70 mt-1">{label}</p>
            {subtitle && <p className="text-[10px] opacity-50 mt-0.5">{subtitle}</p>}
        </div>
    );
};

export default ServiceAnalyticsPage;
