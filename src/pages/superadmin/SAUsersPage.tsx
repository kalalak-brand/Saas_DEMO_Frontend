/**
 * Super Admin - Users Management Page
 * CRUD for hotel admins and viewers
 * Time: O(n) for list rendering, Space: O(n) for user state
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useHotelStore } from '../../stores/hotelStore';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    X,
    Building2,
    Loader2,
    Search,
    Shield,
    Eye,
    UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL;

/* ─── Types ─── */
interface IUserRow {
    _id: string;
    fullName: string;
    username: string;
    role: string;
    isActive: boolean;
    hotelId?: { _id: string; name: string } | string;
    createdAt?: string;
}

interface UserFormData {
    fullName: string;
    username: string;
    password: string;
    role: 'admin' | 'viewer';
    hotelId: string;
}

const EMPTY_FORM: UserFormData = {
    fullName: '',
    username: '',
    password: '',
    role: 'admin',
    hotelId: '',
};

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-50 text-purple-700', icon: Shield },
    admin: { label: 'Admin', color: 'bg-blue-50 text-blue-700', icon: UserCog },
    viewer: { label: 'Viewer', color: 'bg-gray-50 text-gray-600', icon: Eye },
};

/* ─── Component ─── */
const SAUsersPage: React.FC = () => {
    const { hotels, fetchHotels } = useHotelStore();
    const token = useAuthStore((s) => s.token);

    const [users, setUsers] = useState<IUserRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<IUserRow | null>(null);
    const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Time: O(1) — single API call
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/admin/users`, authHeaders);
            setUsers(res.data.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        fetchUsers();
        fetchHotels(true);
    }, [fetchUsers, fetchHotels]);

    /* ─── Handlers ─── */
    const openCreateModal = useCallback(() => {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((user: IUserRow) => {
        setEditingUser(user);
        const hotelId =
            typeof user.hotelId === 'object' && user.hotelId ? user.hotelId._id : (user.hotelId as string) || '';
        setForm({
            fullName: user.fullName,
            username: user.username,
            password: '', // don't pre-fill
            role: user.role as 'admin' | 'viewer',
            hotelId,
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingUser(null);
        setForm(EMPTY_FORM);
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!form.fullName.trim() || !form.username.trim()) {
                toast.error('Name and username are required');
                return;
            }
            if (!editingUser && !form.password) {
                toast.error('Password is required for new users');
                return;
            }
            if (!form.hotelId) {
                toast.error('Please select a hotel');
                return;
            }

            setSaving(true);
            try {
                const payload: Record<string, string> = {
                    fullName: form.fullName.trim(),
                    username: form.username.trim().toLowerCase(),
                    role: form.role,
                    hotelId: form.hotelId,
                };
                if (form.password) payload.password = form.password;

                if (editingUser) {
                    await axios.put(`${BASE_URL}/admin/users/${editingUser._id}`, payload, authHeaders);
                    toast.success('User updated');
                } else {
                    await axios.post(`${BASE_URL}/admin/users`, payload, authHeaders);
                    toast.success('User created');
                }
                closeModal();
                fetchUsers();
            } catch (err) {
                const msg =
                    axios.isAxiosError(err) && err.response?.data?.message
                        ? err.response.data.message
                        : 'Operation failed';
                toast.error(msg);
            } finally {
                setSaving(false);
            }
        },
        [form, editingUser, authHeaders, closeModal, fetchUsers]
    );

    const handleDelete = useCallback(
        async (user: IUserRow) => {
            if (user.role === 'super_admin') {
                toast.error('Cannot delete super admin');
                return;
            }
            if (!window.confirm(`Delete user "${user.fullName}"?`)) return;
            try {
                await axios.delete(`${BASE_URL}/admin/users/${user._id}`, authHeaders);
                toast.success('User deleted');
                fetchUsers();
            } catch {
                toast.error('Failed to delete user');
            }
        },
        [authHeaders, fetchUsers]
    );

    const updateField = useCallback(
        (field: keyof UserFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, [field]: e.target.value }));
            },
        []
    );

    const getHotelName = (user: IUserRow): string => {
        if (!user.hotelId) return '—';
        if (typeof user.hotelId === 'object') return user.hotelId.name;
        const hotel = hotels.find((h) => h._id === user.hotelId);
        return hotel ? hotel.name : '—';
    };

    // Time: O(n) filter
    const filtered = search
        ? users.filter(
            (u) =>
                u.fullName.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase()) ||
                u.role.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    /* ─── Render ─── */
    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage hotel admins and viewers
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, username, or role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
            </div>

            {/* Loading / Empty */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                        {search ? 'No users match your search' : 'No users yet'}
                    </p>
                </div>
            ) : (
                /* Users Table */
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">Hotel</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((user) => {
                                    const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
                                    const RoleIcon = roleConf.icon;
                                    return (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
                                                        {user.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.fullName}</p>
                                                        <p className="text-xs text-gray-400">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${roleConf.color}`}
                                                >
                                                    <RoleIcon className="w-3 h-3" />
                                                    {roleConf.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    {getHotelName(user)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-600'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'
                                                            }`}
                                                    />
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {user.role !== 'super_admin' && (
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit user"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingUser ? 'Edit User' : 'Create User'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={updateField('fullName')}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={updateField('username')}
                                    placeholder="e.g. johndoe"
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent lowercase"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password {!editingUser && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={updateField('password')}
                                    placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    {...(!editingUser ? { required: true, minLength: 6 } : {})}
                                />
                            </div>

                            {/* Role + Hotel */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={updateField('role')}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Hotel <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.hotelId}
                                        onChange={updateField('hotelId')}
                                        required
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">Select hotel</option>
                                        {hotels.map((h) => (
                                            <option key={h._id} value={h._id}>
                                                {h.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SAUsersPage;
