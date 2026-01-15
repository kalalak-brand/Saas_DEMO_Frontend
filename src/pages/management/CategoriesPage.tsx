// src/pages/management/CategoriesPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    FolderPlus,
    Edit2,
    Trash2,
    GripVertical,
    ToggleLeft,
    ToggleRight,
    Plus,
    X,
    AlertTriangle,
    Layers,
    Building,
} from 'lucide-react';
import { useCategoryStore, Category, CategoryPayload } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { useHotelStore } from '../../stores/hotelStore';
import { Button, Card, Input, Badge } from '../../components/ui';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Icon options for categories
const iconOptions = [
    { value: 'bed', label: 'Bed (Room)' },
    { value: 'utensils', label: 'Utensils (F&B)' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'spa', label: 'Spa' },
    { value: 'pool', label: 'Pool' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'gym', label: 'Gym' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'parking', label: 'Parking' },
];

// Category Form Modal Props
interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryPayload) => Promise<boolean>;
    category?: Category | null;
    isLoading: boolean;
}

// Category Form Modal Component
const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    category,
    isLoading,
}) => {
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    const [icon, setIcon] = useState(category?.icon || 'bed');
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setName(category.name);
            setDescription(category.description || '');
            setIcon(category.icon || 'bed');
        } else {
            setName('');
            setDescription('');
            setIcon('bed');
        }
        setError('');
    }, [category, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Category name is required');
            return;
        }

        const success = await onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            icon,
        });

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-xl animate-slide-up">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="text-lg font-semibold text-text-primary">
                        {category ? 'Edit Category' : 'Add Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <Input
                        label="Category Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Spa, Pool, Restaurant"
                        error={error}
                    />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this category..."
                            rows={2}
                            className="input resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Icon
                        </label>
                        <select
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            className="input"
                        >
                            {iconOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {category ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal Props
interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    categoryName: string;
    isLoading: boolean;
}

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    categoryName,
    isLoading,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-surface rounded-2xl shadow-xl animate-slide-up p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-error-light mb-4">
                        <AlertTriangle className="h-6 w-6 text-error" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Delete Category
                    </h3>
                    <p className="text-text-secondary mb-6">
                        Are you sure you want to delete <strong>&quot;{categoryName}&quot;</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Categories Page Component
const CategoriesPage: React.FC = () => {
    // Auth store for role check
    const user = useAuthStore((state) => state.user);
    const isSuperAdmin = user?.role === 'super_admin';

    // Hotel store for super_admin hotel selection
    const { hotels, fetchHotels } = useHotelStore();

    // Category store
    const {
        categories,
        isLoading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryActive,
        selectedHotelId,
        setSelectedHotelId,
    } = useCategoryStore();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteModalCategory, setDeleteModalCategory] = useState<Category | null>(null);

    // Fetch hotels for super_admin
    useEffect(() => {
        if (isSuperAdmin) {
            fetchHotels();
        }
    }, [isSuperAdmin, fetchHotels]);

    // Fetch categories when hotel is selected (for super_admin) or on mount (for others)
    useEffect(() => {
        if (isSuperAdmin) {
            if (selectedHotelId) {
                fetchCategories(true, selectedHotelId);
            }
        } else {
            fetchCategories();
        }
    }, [isSuperAdmin, selectedHotelId, fetchCategories]);

    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

    const handleHotelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const hotelId = e.target.value;
        setSelectedHotelId(hotelId || null);
    }, [setSelectedHotelId]);

    const handleFormSubmit = useCallback(
        async (data: CategoryPayload) => {
            if (editingCategory) {
                const success = await updateCategory(editingCategory._id, data);
                if (success) {
                    toast.success('Category updated successfully');
                }
                return success;
            } else {
                const success = await createCategory(data);
                if (success) {
                    toast.success('Category created successfully');
                }
                return success;
            }
        },
        [editingCategory, createCategory, updateCategory]
    );

    const handleDelete = useCallback(async () => {
        if (deleteModalCategory) {
            // Pass selectedHotelId for super_admin
            const success = await deleteCategory(deleteModalCategory._id, selectedHotelId || undefined);
            if (success) {
                toast.success('Category deleted successfully');
                setDeleteModalCategory(null);
            }
        }
    }, [deleteModalCategory, deleteCategory, selectedHotelId]);

    const handleToggleActive = useCallback(
        async (cat: Category) => {
            // Pass selectedHotelId for super_admin
            await toggleCategoryActive(cat._id, selectedHotelId || undefined);
            toast.success(cat.isActive ? 'Category deactivated' : 'Category activated');
        },
        [toggleCategoryActive, selectedHotelId]
    );

    const openEditModal = useCallback((cat: Category) => {
        setEditingCategory(cat);
        setIsFormModalOpen(true);
    }, []);

    const openCreateModal = useCallback(() => {
        setEditingCategory(null);
        setIsFormModalOpen(true);
    }, []);

    // Show hotel selector for super_admin
    const canManage = !isSuperAdmin || selectedHotelId;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary-100">
                        <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Categories</h1>
                        <p className="text-text-secondary">Manage review categories</p>
                    </div>
                </div>
                <Button
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={openCreateModal}
                    disabled={!canManage}
                >
                    Add Category
                </Button>
            </div>

            {/* Hotel Selector for Super Admin */}
            {isSuperAdmin && (
                <Card padding="md" className="bg-primary-50 border-primary-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            <span className="font-medium text-primary">Select Hotel:</span>
                        </div>
                        <select
                            value={selectedHotelId || ''}
                            onChange={handleHotelChange}
                            className="flex-1 px-4 py-2 border border-primary-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">-- Select a hotel to manage categories --</option>
                            {hotels.map((hotel) => (
                                <option key={hotel._id} value={hotel._id}>
                                    {hotel.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>
            )}

            {error && (
                <div className="p-4 rounded-lg bg-error-light text-error flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Show message if super_admin hasn't selected a hotel */}
            {isSuperAdmin && !selectedHotelId && (
                <Card padding="lg" className="text-center">
                    <Building className="h-12 w-12 mx-auto mb-3 text-text-muted opacity-50" />
                    <p className="text-text-secondary">Please select a hotel above to manage its categories.</p>
                </Card>
            )}

            {/* Category List - only show when hotel is selected (or for non-super_admin) */}
            {canManage && (
                <Card padding="none">
                    <div className="divide-y divide-border">
                        {sortedCategories.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">
                                <FolderPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No categories yet. Create your first category!</p>
                            </div>
                        ) : (
                            sortedCategories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className={clsx(
                                        'flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors',
                                        !cat.isActive && 'opacity-60'
                                    )}
                                >
                                    <div className="cursor-grab text-text-muted hover:text-text-secondary">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-text-primary">{cat.name}</span>
                                            <Badge variant={cat.isActive ? 'success' : 'default'}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-text-muted truncate">
                                            {cat.description || `Slug: ${cat.slug}`}
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-surface-elevated text-text-secondary text-sm font-medium">
                                        {cat.order}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(cat)}
                                            className={clsx(
                                                'p-2 rounded-lg transition-colors',
                                                cat.isActive
                                                    ? 'text-success hover:bg-success-light'
                                                    : 'text-text-muted hover:bg-surface-hover'
                                            )}
                                            title={cat.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {cat.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-50 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModalCategory(cat)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error-light transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}

            <CategoryFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleFormSubmit}
                category={editingCategory}
                isLoading={isLoading}
            />

            <DeleteConfirmModal
                isOpen={!!deleteModalCategory}
                onClose={() => setDeleteModalCategory(null)}
                onConfirm={handleDelete}
                categoryName={deleteModalCategory?.name || ''}
                isLoading={isLoading}
            />
        </div>
    );
};

export default CategoriesPage;
