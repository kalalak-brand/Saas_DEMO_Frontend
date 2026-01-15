import React from 'react';
import Modal from './Modal';
import { Hotel, Utensils, Coffee, Layers } from 'lucide-react';
import { useActiveCategories } from '../../stores/categoryStore';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: string) => void;
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const activeCategories = useActiveCategories();

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'room':
        return <Hotel size={40} />;
      case 'f&b':
        return <Utensils size={40} />;
      case 'cfc':
        return <Coffee size={40} />;
      default:
        return <Layers size={40} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Category to Compare</h2>
        <p className="text-gray-600 mb-8">
          Please select which category you would like to compare data for.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSubmit(cat.slug)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-primary text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all"
            >
              {getIcon(cat.slug)}
              <span className="text-xl font-semibold">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CategorySelectionModal;
