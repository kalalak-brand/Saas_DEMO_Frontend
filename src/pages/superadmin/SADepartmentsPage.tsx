/**
 * SaaS Admin — Departments Page
 * Full CRUD for managing departments per hotel.
 * SaaS Admin can create, edit, toggle, and delete departments.
 *
 * Time: O(d) where d = departments per hotel, Space: O(d)
 */
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { Briefcase, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Department {
    _id: string;
    name: string;
    description?: string;
    hotelId: string;
    isActive: boolean;
    linkedCategoryId?: string;
    serviceTypes?: string[];
    createdAt: string;
}

interface Hotel {
    _id: string;
    name: string;
    code: string;
}

/**
 * SAADepartmentsPage — SaaS Admin Department Management
 */
const SADepartmentsPage: React.FC = () => {
    const token = useAuthStore((s) => s.token);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch hotels on mount
    // Time: O(h) where h = total hotels
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/hotels`, { headers });
                const hotelData = res.data?.data?.hotels || res.data?.hotels || [];
                setHotels(hotelData);
                if (hotelData.length > 0) {
                    setSelectedHotelId(hotelData[0]._id);
                }
            } catch {
                toast.error('Failed to load hotels');
            }
        };
        fetchHotels();
    }, []);

    // Fetch departments when hotel changes
    // Time: O(d) where d = departments for selected hotel
    const fetchDepartments = useCallback(async () => {
        if (!selectedHotelId) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/saas/departments?hotelId=${selectedHotelId}`, { headers });
            setDepartments(res.data?.data?.departments || []);
        } catch {
            toast.error('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    }, [selectedHotelId, token]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    // Create or update department
    // Time: O(1), Space: O(1)
    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Department name is required');
            return;
        }
        try {
            if (editingDept) {
                await axios.put(`${BASE_URL}/saas/departments/${editingDept._id}`, {
                    name: formName.trim(),
                    description: formDescription.trim() || undefined,
                    hotelId: selectedHotelId,
                }, { headers });
                toast.success('Department updated');
            } else {
                await axios.post(`${BASE_URL}/saas/departments`, {
                    name: formName.trim(),
                    description: formDescription.trim() || undefined,
                    hotelId: selectedHotelId,
                }, { headers });
                toast.success('Department created');
            }
            setShowModal(false);
            setEditingDept(null);
            setFormName('');
            setFormDescription('');
            fetchDepartments();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Operation failed';
            toast.error(msg || 'Operation failed');
        }
    };

    // Toggle department active status
    // Time: O(1)
    const handleToggle = async (dept: Department) => {
        try {
            await axios.patch(`${BASE_URL}/saas/departments/${dept._id}/toggle`, { hotelId: selectedHotelId }, { headers });
            toast.success(`Department ${dept.isActive ? 'deactivated' : 'activated'}`);
            fetchDepartments();
        } catch {
            toast.error('Failed to toggle department');
        }
    };

    // Delete department
    // Time: O(1)
    const handleDelete = async (dept: Department) => {
        if (!confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${BASE_URL}/saas/departments/${dept._id}?hotelId=${selectedHotelId}`, { headers });
            toast.success('Department deleted');
            fetchDepartments();
        } catch {
            toast.error('Failed to delete department');
        }
    };

    const openCreateModal = () => {
        setEditingDept(null);
        setFormName('');
        setFormDescription('');
        setShowModal(true);
    };

    const openEditModal = (dept: Department) => {
        setEditingDept(dept);
        setFormName(dept.name);
        setFormDescription(dept.description || '');
        setShowModal(true);
    };

    // Filtered departments by search
    // Time: O(d) where d = departments
    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-600" />
                        Department Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage departments for each hotel
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    disabled={!selectedHotelId}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Department
                </button>
            </div>

            {/* Hotel selector */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Building2 className="w-5 h-5 text-gray-400" />
                <select
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                    {hotels.map((h) => (
                        <option key={h._id} value={h._id}>
                            {h.name} ({h.code})
                        </option>
                    ))}
                </select>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-48"
                    />
                </div>
            </div>

            {/* Department list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">No departments found</p>
                    <p className="text-sm mt-1">Create the first department for this hotel</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((dept) => (
                        <div
                            key={dept._id}
                            className={`flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm transition-all ${
                                dept.isActive ? 'border-gray-200' : 'border-orange-200 bg-orange-50/50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    dept.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${dept.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {dept.name}
                                    </p>
                                    {dept.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>
                                    )}
                                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                        dept.isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {dept.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggle(dept)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    title={dept.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {dept.isActive ? (
                                        <ToggleRight className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <button
                                    onClick={() => openEditModal(dept)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                    onClick={() => handleDelete(dept)}
                                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingDept ? 'Edit Department' : 'Create Department'}
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department Name *
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="e.g. Housekeeping"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Brief description of the department's role..."
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => { setShowModal(false); setEditingDept(null); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                            >
                                {editingDept ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SADepartmentsPage;
