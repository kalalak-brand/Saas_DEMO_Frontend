import React, { useState, useEffect } from 'react';
import { useHotelStore, IHotel } from '../../stores/hotelStore';
// <-- REMOVED UNUSED IMPORTS (useAuthStore, Navigate)
import { Edit, Trash2, PlusCircle, Building } from 'lucide-react';
import Modal from '../../components/common/Modal';

const HotelManagementPage: React.FC = () => {
  const { 
    hotels, 
    isLoading, 
    error, 
    fetchHotels, 
    createHotel, 
    updateHotel, 
    deleteHotel 
  } = useHotelStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<IHotel | null>(null);
  const [hotelName, setHotelName] = useState('');

  // <-- REMOVED isSuperAdmin check -->

  useEffect(() => {
    fetchHotels(true); // Force fetch when visiting this page
  }, [fetchHotels]);

  // <-- REMOVED Security Redirect Block -->

  const openCreateModal = () => {
    setEditingHotel(null);
    setHotelName('');
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: IHotel) => {
    setEditingHotel(hotel);
    setHotelName(hotel.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHotel(null);
    setHotelName('');
  };

  const handleDelete = (hotel: IHotel) => {
    if (window.confirm(`Are you sure you want to delete ${hotel.name}? This action cannot be undone.`)) {
      deleteHotel(hotel._id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName) return;

    let success = false;
    if (editingHotel) {
      success = await updateHotel(editingHotel._id, hotelName);
    } else {
      success = await createHotel(hotelName);
    }

    if (success) {
      closeModal();
    }
  };

  return (
    <div style={{ color: '#650933' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Hotels</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#650933] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Add Hotel
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {isLoading && hotels.length === 0 && <p>Loading hotels...</p>}
          {hotels.map(hotel => (
            <li key={hotel._id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Building size={18} className="text-gray-500" />
                <span className="font-medium text-gray-800">{hotel.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => openEditModal(hotel)} className="text-blue-500 hover:text-blue-700" title="Edit">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(hotel)} className="text-red-500 hover:text-red-700" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
          </h2>
          <div>
            <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">Hotel Name</label>
            <input
              type="text"
              name="hotelName"
              id="hotelName"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#650933] focus:ring-[#650933] py-2 px-4"
              required
              autoFocus
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#650933] text-white hover:bg-opacity-90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HotelManagementPage;