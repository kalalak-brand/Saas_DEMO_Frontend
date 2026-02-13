// frontend/pages/QuestionsPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useManagementStore, Question } from "../../stores/managementStore";
import { useActiveCategories } from "../../stores/categoryStore";
import { useAuthStore } from "../../stores/authStore";
import { useHotelStore } from "../../stores/hotelStore";
import { Edit, Trash2, PlusCircle, Eye, EyeOff } from "lucide-react";
import Modal from "../../components/common/Modal";
import { clsx } from "clsx";

// --- Reusable Question List Component ---
interface QuestionListProps {
  list: Question[];
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  emptyMessage: string;
  onToggleActive: (question: Question) => void; // Passed from main component
}

// ✅ FIXED: Added 'onToggleActive' to props destructuring
const QuestionList: React.FC<QuestionListProps> = ({
  list,
  onEdit,
  onDelete,
  emptyMessage,
  onToggleActive, // Now correctly received
}) => {
  if (list.length === 0) {
    return <p className="text-gray-500 text-center p-4">{emptyMessage}</p>;
  }

  const sortedList = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <ul className="divide-y divide-gray-200">
      {sortedList.map((q) => (
        <li
          key={q._id}
          className={clsx(
            "flex items-center justify-between p-3 hover:bg-gray-50",
            !q.isActive && "bg-gray-100 opacity-70" // Style for inactive
          )}
        >
          <div>
            <span className="font-medium text-gray-700">
              (Order: {q.order || 0}) {q.text}
            </span>
            <span className="ml-3 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {q.questionType.replace("_", "/")}
            </span>
            {/* ADD Inactive Badge */}
            {!q.isActive && (
              <span className="ml-3 text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">
                INACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* ADD Toggle Button */}
            <button
              onClick={() => onToggleActive(q)} // This will now work
              className={clsx(
                "p-1",
                q.isActive
                  ? "text-gray-400 hover:text-green-600"
                  : "text-red-400 hover:text-red-600"
              )}
              title={q.isActive ? "Deactivate" : "Activate"}
            >
              {q.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button
              onClick={() => onEdit(q)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(q)}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

// --- Main Page Component ---
const QuestionsPage: React.FC = () => {
  const {
    questions,
    isLoading,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    toggleQuestionActive,
    deleteQuestion,
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  // Use first category _id as default for tab (since questions use category ID)
  const [activeTab, setActiveTab] = useState<string>('');

  // Set default tab when categories load (using category _id)
  useEffect(() => {
    if (activeCategories.length > 0 && !activeTab) {
      setActiveTab(activeCategories[0]._id);
    }
  }, [activeCategories, activeTab]);

  // Filter questions by current tab category (using category _id)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => q.category === activeTab);
  }, [questions, activeTab]);

  // Handler to call the store action
  const handleToggleActive = (question: Question) => {
    toggleQuestionActive(question);
  };

  useEffect(() => {
    // For super_admin, need hotelId; for others, hotelId is undefined
    if (isSuperAdmin) {
      if (selectedHotelId) {
        fetchQuestions(true, selectedHotelId);
      }
    } else {
      fetchQuestions(true);
    }
  }, [fetchQuestions, isSuperAdmin, selectedHotelId]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const openDeleteModal = (question: Question) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${question.text}"? This action cannot be undone.`
      )
    ) {
      deleteQuestion(question._id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = formData.get("text") as string;
    const category = formData.get("category") as string; // Now sending category _id
    const questionType = formData.get("questionType") as "rating" | "yes_no";
    const order = Number(formData.get("order") || 0);
    const isActive = formData.get("isActive") === "on"; // Get value from checkbox

    if (!text || !category || !questionType) {
      console.error("Validation failed: All fields are required.");
      return;
    }

    // Build payload - include hotelId for super_admin
    const payload: any = { text, category, questionType, order, isActive };
    if (isSuperAdmin && selectedHotelId) {
      payload.hotelId = selectedHotelId;
    }

    if (editingQuestion) {
      updateQuestion(editingQuestion._id, payload);
    } else {
      createQuestion(payload);
    }
    closeModal();
  };

  // Helper for tab class names
  const getTabClassName = (tabSlug: string) => {
    return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === tabSlug
      ? 'border-primary text-primary'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`;
  };

  return (
    <div className="text-primary border-[3px] border-primary rounded-[20px] p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Questions</h1>
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
            Create Question
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
      <div className="bg-white rounded-lg shadow-md overflow-y-auto">
        {isLoading && questions.length === 0 ? (
          <p className="text-center text-gray-500 p-10">Loading questions...</p>
        ) : activeCategories.length === 0 ? (
          <p className="text-center text-gray-500 p-10">Please create categories first to manage questions.</p>
        ) : (
          <QuestionList
            list={filteredQuestions}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onToggleActive={handleToggleActive}
            emptyMessage={`No ${activeCategories.find(c => c._id === activeTab)?.name?.toUpperCase() || ''} questions found.`}
          />
        )}
      </div>

      {/* --- MODAL FOR CREATE/EDIT --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingQuestion ? "Edit Question" : "Create New Question"}
          </h2>

          {/* Text Input */}
          <div className="mb-4">
            <label
              htmlFor="text"
              className="block text-sm font-medium text-gray-700"
            >
              Question Text
            </label>
            <input
              name="text"
              id="text"
              defaultValue={editingQuestion?.text || ""}
              className="form-input mt-1"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Category Select */}
            <div className="mb-4">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                name="category"
                id="category"
                defaultValue={
                  editingQuestion
                    ? (typeof editingQuestion.category === 'string'
                      ? editingQuestion.category
                      : (editingQuestion.category as any)?._id || activeCategories.find(c => c.slug === activeTab)?._id)
                    : activeCategories.find(c => c.slug === activeTab)?._id || ''
                }
                className="form-select mt-1"
              >
                {activeCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type Select */}
            <div className="mb-4">
              <label
                htmlFor="questionType"
                className="block text-sm font-medium text-gray-700"
              >
                Question Type
              </label>
              <select
                name="questionType"
                id="questionType"
                defaultValue={editingQuestion?.questionType || "rating"}
                className="form-select mt-1"
              >
                <option value="rating">Rating (0-5)</option>
                <option value="yes_no">Yes / No</option>
              </select>
            </div>

            {/* Order Input */}
            <div className="mb-4">
              <label
                htmlFor="order"
                className="block text-sm font-medium text-gray-700"
              >
                Order
              </label>
              <input
                type="number"
                name="order"
                id="order"
                defaultValue={editingQuestion?.order || 0}
                className="form-input mt-1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2 form-label">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                defaultChecked={editingQuestion ? editingQuestion.isActive : true}
                className="form-checkbox"
              />
              Active (Visible to users)
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeModal} className="form-btn-secondary">Cancel</button>
            <button type="submit" className="form-btn-primary">Save Question</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionsPage;