// frontend/pages/CompositesPageMngt.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useManagementStore, Composite, Question } from '../../stores/managementStore';
import { useActiveCategories } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { useHotelStore } from '../../stores/hotelStore';
import { Edit, Trash2, PlusCircle, Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { clsx } from 'clsx';

// --- Category-Filtered Question List Component ---
interface QuestionSelectorProps {
  allQuestions: Question[];
  selectedCategory: string; // Dynamic category
  checkedIds: string[];
  onCheckboxChange: (questionId: string, isChecked: boolean) => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  allQuestions,
  selectedCategory,
  checkedIds,
  onCheckboxChange
}) => {
  const filteredQuestions = useMemo(() => {
    // Also filter out inactive questions from the selector
    return allQuestions
      .filter(q => q.category === selectedCategory && q.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allQuestions, selectedCategory]);

  if (filteredQuestions.length === 0) {
    return <p className="text-sm text-gray-500 text-center p-4">No *active* {selectedCategory.toUpperCase()} questions found. Please create or activate some first.</p>;
  }

  return (
    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
      {filteredQuestions.map(q => (
        <div key={q._id} className="flex items-center">
          <input
            type="checkbox"
            id={`question-${q._id}`}
            name={`question-${q._id}`}
            value={q._id}
            checked={checkedIds.includes(q._id)}
            onChange={(e) => onCheckboxChange(q._id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 "
          />
          <label htmlFor={`question-${q._id}`} className="ml-2 block text-sm text-gray-900">{q.text} (Order: {q.order || 0})</label>
        </div>
      ))}
    </div>
  );
};

// --- Reusable Composite List Component ---
interface CompositeListProps {
  composites: Composite[];
  onEdit: (composite: Composite) => void;
  onDelete: (composite: Composite) => void;
  onToggleActive: (composite: Composite) => void; // ✅ ADDED
  itemStyle: string;
  emptyMessage: string;
}

const CompositeList: React.FC<CompositeListProps> = ({ composites, onEdit, onDelete, onToggleActive, itemStyle, emptyMessage }) => {
  if (composites.length === 0) {
    return <p className="text-gray-500 md:col-span-2">{emptyMessage}</p>;
  }
  const sortedComposites = [...composites].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sortedComposites.map(comp => (
        <div key={comp._id} className={clsx(
          itemStyle,
          !comp.isActive && "bg-gray-100 opacity-70 hover:bg-gray-200" // ✅ Style for inactive
        )}>
          {/* ✅ ADD Inactive Badge */}
          {!comp.isActive && <span className="absolute top-2 left-2 text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">INACTIVE</span>}
          <span className="pr-20">(Order: {comp.order || 0}) {comp.name}</span>
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-2">
            {/* ✅ ADD Toggle Button */}
            <button
              onClick={() => onToggleActive(comp)}
              className={clsx("p-1", comp.isActive ? "text-gray-400 hover:text-green-600" : "text-red-400 hover:text-red-600")}
              title={comp.isActive ? "Deactivate" : "Activate"}
            >
              {comp.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button onClick={() => onEdit(comp)} className="p-1 text-primary/70 hover:text-primary" title="Edit">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(comp)} className="p-1 text-red-500/70 hover:text-red-700" title="Delete">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Page Component ---
const CompositesPageMngt: React.FC = () => {
  const {
    composites,
    questions,
    isLoading,
    fetchComposites,
    fetchQuestions,
    createComposite,
    updateComposite,
    deleteComposite,
    toggleCompositeActive,
  } = useManagementStore();

  // Get active categories dynamically
  const activeCategories = useActiveCategories();

  // Get user role and hotel info
  const { user } = useAuthStore();
  const { hotels, fetchHotels } = useHotelStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');

  // Fetch hotels for super_admin on mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchHotels();
    }
  }, [isSuperAdmin, fetchHotels]);

  // Set default hotel when hotels load for super_admin
  useEffect(() => {
    if (isSuperAdmin && hotels.length > 0 && !selectedHotelId) {
      setSelectedHotelId(hotels[0]._id);
    }
  }, [isSuperAdmin, hotels, selectedHotelId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposite, setEditingComposite] = useState<Composite | null>(null);
  const [modalCategory, setModalCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Set default tab when categories load (using category _id)
  useEffect(() => {
    if (activeCategories.length > 0 && !activeTab) {
      setActiveTab(activeCategories[0]._id);
      setModalCategory(activeCategories[0]._id);
    }
  }, [activeCategories, activeTab]);

  // Filter composites by current tab category (using category _id)
  const filteredComposites = useMemo(() => {
    return composites.filter(c => c.category === activeTab);
  }, [composites, activeTab]);

  useEffect(() => {
    // For super_admin, need hotelId; for others, hotelId is undefined
    if (isSuperAdmin) {
      if (selectedHotelId) {
        fetchComposites(true, selectedHotelId);
        fetchQuestions(true, selectedHotelId);
      }
    } else {
      fetchComposites(true);
      fetchQuestions(true);
    }
  }, [fetchComposites, fetchQuestions, isSuperAdmin, selectedHotelId]);

  const openCreateModal = () => {
    setEditingComposite(null);
    setModalCategory(activeTab);
    setSelectedQuestionIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (composite: Composite) => {
    setEditingComposite(composite);
    setModalCategory(composite.category);
    setSelectedQuestionIds(
      (composite.questions || []).map((q: any) => (typeof q === 'string' ? q : q._id))
    );
    setIsModalOpen(true);
  };

  const openDeleteModal = (composite: Composite) => {
    if (window.confirm(`Are you sure you want to delete "${composite.name}"?`)) {
      deleteComposite(composite._id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingComposite(null);
    setSelectedQuestionIds([]);
  };

  // ✅ ADDED Handler
  const handleToggleActive = (composite: Composite) => {
    toggleCompositeActive(composite);
  };

  const handleCheckboxChange = (questionId: string, isChecked: boolean) => {
    setSelectedQuestionIds(prevIds => {
      if (isChecked) {
        return Array.from(new Set([...prevIds, questionId]));
      } else {
        return prevIds.filter(id => id !== questionId);
      }
    });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const category = modalCategory;
    const order = Number(formData.get('order') || 0);
    const isActive = formData.get('isActive') === 'on'; // ✅ ADDED

    if (!name || !category || selectedQuestionIds.length === 0) {
      console.error('Validation failed: Name, category, and at least one question required. Current selected IDs:', selectedQuestionIds);
      alert('Validation failed: Name, category, and at least one question required.');
      return;
    }

    const payload: any = { name, questions: selectedQuestionIds, category, order, isActive };
    // Add hotelId for super_admin
    if (isSuperAdmin && selectedHotelId) {
      payload.hotelId = selectedHotelId;
    }

    if (editingComposite) {
      updateComposite(editingComposite._id, payload);
    } else {
      createComposite(payload);
    }
    closeModal();
  };

  const compositeItemStyle = "relative bg-secondary/75 p-5 rounded-lg text-center font-semibold uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors";

  // Helper for Tab styling
  const getTabClassName = (tabName: string) => {
    return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === tabName
      ? 'border-primary text-primary'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`;
  };

  return (
    <div className="border-[3px] border-primary rounded-[20px] p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Composites</h1>
        <div className="flex items-center flex-col sm:flex-row gap-4">
          {/* Hotel selector for super_admin */}
          {isSuperAdmin && (
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value="">Select Hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 shadow"
            disabled={activeCategories.length === 0 || (isSuperAdmin && !selectedHotelId)}
          >
            <PlusCircle size={20} />
            Create Composite
          </button>
        </div>
      </div>

      {/* --- Dynamic Tab Navigation --- */}
      <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {activeCategories.length === 0 ? (
            <p className="py-4 text-gray-500">No categories available. Please create categories first.</p>
          ) : (
            activeCategories.map((category) => (
              <button
                key={category._id}
                onClick={() => setActiveTab(category._id)}
                className={getTabClassName(category._id)}
              >
                {category.name}
              </button>
            ))
          )}
        </nav>
      </div>

      {/* --- Tab Content --- */}
      <div>
        {isLoading && composites.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Loading composites...</p>
        ) : activeCategories.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Please create categories first to manage composites.</p>
        ) : (
          <CompositeList
            composites={filteredComposites}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onToggleActive={handleToggleActive}
            itemStyle={compositeItemStyle}
            emptyMessage={`No ${activeTab.toUpperCase()} composites found.`}
          />
        )}
      </div>


      {/* --- MODAL FOR CREATE/EDIT --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingComposite ? 'Edit Composite' : 'Create New Composite'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Name, Order, Category inputs */}
            <div className="mb-4 col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Composite Name</label>
              <input
                type="text" name="name" id="name"
                defaultValue={editingComposite?.name || ''}
                className="mt-1 block py-2 px-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required autoFocus
              />
            </div>
            <div className="mb-4 col-span-1">
              <label htmlFor="order" className="block text-sm font-medium text-gray-700">Order</label>
              <input
                type="number"
                name="order"
                id="order"
                defaultValue={editingComposite?.order || 0}
                className="mt-1 block py-2 px-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="mb-4 col-span-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category" id="category"
                value={modalCategory}
                onChange={(e) => {
                  const newCat = e.target.value;
                  if (!editingComposite) { setSelectedQuestionIds([]); }
                  setModalCategory(newCat);
                }}
                disabled={!!editingComposite}
                className="mt-1 block py-2 px-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white disabled:bg-gray-100"
              >
                {activeCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              {editingComposite && <p className="text-xs text-gray-500 mt-1">Category cannot be changed after creation.</p>}
              <input type="hidden" name="category" value={modalCategory} />
            </div>

            {/* ✅ ADD IsActive Toggle */}
            <div className="mb-4 col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  defaultChecked={editingComposite ? editingComposite.isActive : true}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active (Visible to users)
              </label>
            </div>
          </div>

          {/* Question Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Questions (from {modalCategory.toUpperCase()} category)</label>
            <QuestionSelector
              key={`${editingComposite ? editingComposite._id : 'new'}-${modalCategory}`}
              allQuestions={questions}
              selectedCategory={modalCategory}
              checkedIds={selectedQuestionIds}
              onCheckboxChange={handleCheckboxChange}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompositesPageMngt;