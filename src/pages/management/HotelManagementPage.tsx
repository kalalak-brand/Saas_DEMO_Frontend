/**
 * Hotel Management Page
 * CRUD interface for hotel admins to manage hotels.
 * 
 * Time: O(n) render where n = hotels count
 * Space: O(n) hotels in store + O(1) component state
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useHotelStore, IHotel } from '../../stores/hotelStore';
import { Edit, Trash2, PlusCircle, Building, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';

const HotelManagementPage: React.FC = () => {
  const {
    hotels,
    isLoading,
    error,
    fetchHotels,
    createHotel,
    updateHotel,
    deleteHotel,
    clearError,
  } = useHotelStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<IHotel | null>(null);
  const [hotelName, setHotelName] = useState('');

  useEffect(() => {
    fetchHotels(true);
  }, [fetchHotels]);

  // Clear stale errors when page mounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const openCreateModal = useCallback(() => {
    setEditingHotel(null);
    setHotelName('');
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((hotel: IHotel) => {
    setEditingHotel(hotel);
    setHotelName(hotel.name);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingHotel(null);
    setHotelName('');
  }, []);

  const handleDelete = useCallback(
    (hotel: IHotel) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${hotel.name}"? This action cannot be undone.`
        )
      ) {
        deleteHotel(hotel._id);
      }
    },
    [deleteHotel]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = hotelName.trim();

    // Client-side validation
    if (!trimmedName) return;
    if (trimmedName.length < 2) return;

    let success = false;
    if (editingHotel) {
      success = await updateHotel(editingHotel._id, { name: trimmedName });
    } else {
      success = await createHotel({ name: trimmedName });
    }

    if (success) {
      closeModal();
    }
  };

  return (
    <div className="text-text-primary">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Hotels</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
        >
          <PlusCircle size={20} />
          Add Hotel
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-100 p-3 rounded-md mb-4">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md">
        {isLoading && hotels.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">Loading hotels...</p>
        ) : hotels.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <Building size={40} />
            <p>No hotels found. Create your first hotel to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {hotels.map((hotel) => (
              <li
                key={hotel._id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <Building size={18} className="text-primary" />
                  <span className="font-medium text-gray-800">
                    {hotel.name}
                  </span>
                  {hotel.code && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {hotel.code}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEditModal(hotel)}
                    className="text-primary hover:text-primary-light"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(hotel)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
          </h2>
          <div>
            <label
              htmlFor="hotelName"
              className="block text-sm font-medium text-gray-700"
            >
              Hotel Name
            </label>
            <input
              type="text"
              name="hotelName"
              id="hotelName"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary py-2 px-4"
              required
              minLength={2}
              maxLength={150}
              autoFocus
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
              disabled={isLoading || !hotelName.trim()}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HotelManagementPage;