/**
 * Super Admin - Hotels Management Page
 * CRUD operations for hotels with a clean card layout
 * Time: O(n) for list rendering, Space: O(n) for hotel state
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useHotelStore, IHotel } from '../../stores/hotelStore';
import { useAuthStore } from '../../stores/authStore';
import {
    Building2,
    Plus,
    Edit2,
    Trash2,
    X,
    MapPin,
    Mail,
    Phone,
    Hash,
    Loader2,
    Search,
    Upload,
    Image as ImageIcon,
    XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Types ─── */
interface HotelFormData {
    name: string;
    code: string;
    address: string;
    city: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
}

const EMPTY_FORM: HotelFormData = {
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    contactEmail: '',
    contactPhone: '',
};

/* ─── Component ─── */
const SAHotelsPage: React.FC = () => {
    const { hotels, isLoading, fetchHotels, createHotel, updateHotel, deleteHotel, uploadLogo, deleteLogo } =
        useHotelStore();
    const { user } = useAuthStore();

    const [showModal, setShowModal] = useState(false);
    const [editingHotel, setEditingHotel] = useState<IHotel | null>(null);
    const [form, setForm] = useState<HotelFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoTargetHotelId, setLogoTargetHotelId] = useState<string | null>(null);

    // Filter hotels: super_admin with hotelId sees only their hotel
    const userHotelId = user?.hotelId?._id;
    const visibleHotels = userHotelId
        ? hotels.filter(h => h._id === userHotelId)
        : hotels;

    useEffect(() => {
        fetchHotels(true);
    }, [fetchHotels]);

    /* ─── Handlers ─── */
    const openCreateModal = useCallback(() => {
        setEditingHotel(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((hotel: IHotel) => {
        setEditingHotel(hotel);
        setForm({
            name: hotel.name,
            code: hotel.code || '',
            address: hotel.address || '',
            city: hotel.city || '',
            country: hotel.country || '',
            contactEmail: hotel.contactEmail || '',
            contactPhone: hotel.contactPhone || '',
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingHotel(null);
        setForm(EMPTY_FORM);
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!form.name.trim()) {
                toast.error('Hotel name is required');
                return;
            }

            setSaving(true);
            const payload: Partial<IHotel> = {
                name: form.name.trim(),
                ...(form.code && { code: form.code.trim().toUpperCase() }),
                ...(form.address && { address: form.address.trim() }),
                ...(form.city && { city: form.city.trim() }),
                ...(form.country && { country: form.country.trim() }),
                ...(form.contactEmail && { contactEmail: form.contactEmail.trim() }),
                ...(form.contactPhone && { contactPhone: form.contactPhone.trim() }),
            };

            let success: boolean;
            if (editingHotel) {
                success = await updateHotel(editingHotel._id, payload);
                if (success) toast.success('Hotel updated successfully');
            } else {
                success = await createHotel(payload);
                if (success) toast.success('Hotel created successfully');
            }

            if (success) closeModal();
            else toast.error('Operation failed. Please try again.');
            setSaving(false);
        },
        [form, editingHotel, createHotel, updateHotel, closeModal]
    );

    const handleDelete = useCallback(
        async (hotel: IHotel) => {
            if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
            const success = await deleteHotel(hotel._id);
            if (success) toast.success('Hotel deleted');
            else toast.error('Failed to delete hotel');
        },
        [deleteHotel]
    );

    const updateField = useCallback(
        (field: keyof HotelFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
        },
        []
    );

    // Time: O(n) filter
    const filtered = search
        ? visibleHotels.filter(
            (h) =>
                h.name.toLowerCase().includes(search.toLowerCase()) ||
                (h.code && h.code.toLowerCase().includes(search.toLowerCase()))
        )
        : visibleHotels;

    /* ─── Logo handlers ─── */
    const handleLogoUploadClick = (hotelId: string) => {
        setLogoTargetHotelId(hotelId);
        logoInputRef.current?.click();
    };

    const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !logoTargetHotelId) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }
        setUploadingLogoId(logoTargetHotelId);
        const result = await uploadLogo(logoTargetHotelId, file);
        if (result) toast.success('Logo uploaded!');
        else toast.error('Failed to upload logo');
        setUploadingLogoId(null);
        setLogoTargetHotelId(null);
        e.target.value = '';
    };

    const handleLogoDelete = async (hotelId: string) => {
        if (!window.confirm('Remove the logo?')) return;
        setUploadingLogoId(hotelId);
        const result = await deleteLogo(hotelId);
        if (result) toast.success('Logo removed');
        else toast.error('Failed to remove logo');
        setUploadingLogoId(null);
    };

    /* ─── Render ─── */
    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{userHotelId ? 'My Hotel' : 'Hotels'}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {userHotelId ? 'Manage your allocated hotel' : 'Manage all hotels in the system'}
                    </p>
                </div>
                {!userHotelId && (
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Hotel
                    </button>
                )}
            </div>

            {/* Hidden file input for logo upload */}
            <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
            />

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search hotels by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
            </div>

            {/* Loading */}
            {isLoading && hotels.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                        {search ? 'No hotels match your search' : 'No hotels yet'}
                    </p>
                    {!search && (
                        <p className="text-gray-400 text-sm mt-1">
                            Click "Add Hotel" to create your first hotel
                        </p>
                    )}
                </div>
            ) : (
                /* Hotel Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((hotel) => (
                        <div
                            key={hotel._id}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Hotel logo/icon — clickable for upload */}
                                    <div
                                        className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors overflow-hidden relative group/logo"
                                        title={hotel.logo?.url ? 'Change logo' : 'Upload logo'}
                                        onClick={() => handleLogoUploadClick(hotel._id)}
                                    >
                                        {uploadingLogoId === hotel._id ? (
                                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                        ) : hotel.logo?.url ? (
                                            <>
                                                <img src={hotel.logo.url} alt="Logo" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="w-4 h-4 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Building2 className="w-5 h-5 text-indigo-600 group-hover/logo:hidden" />
                                                <Upload className="w-5 h-5 text-indigo-600 hidden group-hover/logo:block" />
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                                        {hotel.code && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5">
                                                <Hash className="w-3 h-3" />
                                                {hotel.code}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(hotel)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit hotel"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(hotel)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete hotel"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5 text-sm text-gray-500">
                                {(hotel.address || hotel.city) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">
                                            {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {hotel.contactEmail && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{hotel.contactEmail}</span>
                                    </div>
                                )}
                                {hotel.contactPhone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{hotel.contactPhone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Status badge + logo actions */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span
                                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${hotel.isActive !== false
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-600'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${hotel.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                    {hotel.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex items-center gap-1">
                                    {hotel.logo?.url ? (
                                        <button
                                            onClick={() => handleLogoDelete(hotel._id)}
                                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                                            title="Remove logo"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            Remove Logo
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleLogoUploadClick(hotel._id)}
                                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                                            title="Upload logo"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            Add Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingHotel ? 'Edit Hotel' : 'Create Hotel'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Hotel Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={updateField('name')}
                                    placeholder="e.g. Grand Hyatt Mumbai"
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Hotel Code
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={updateField('code')}
                                        placeholder="Auto-generated if empty"
                                        maxLength={10}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Alphanumeric, 2-10 chars. Used in QR code URLs.
                                </p>
                            </div>

                            {/* Address + City (row) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={updateField('address')}
                                        placeholder="Street address"
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={updateField('city')}
                                        placeholder="City"
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Contact row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.contactEmail}
                                        onChange={updateField('contactEmail')}
                                        placeholder="admin@hotel.com"
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={form.contactPhone}
                                        onChange={updateField('contactPhone')}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
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
                                    {editingHotel ? 'Save Changes' : 'Create Hotel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SAHotelsPage;
