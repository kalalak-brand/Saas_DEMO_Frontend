import React, { useState, useEffect } from 'react';
import { useManagementStore, ManagementUser } from '../../stores/managementStore';
import { Edit, Trash2, PlusCircle, Home } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useAuthStore, IUser } from '../../stores/authStore';
import { useHotelStore } from '../../stores/hotelStore';

type UserRole = IUser['role'];

const UsersPage: React.FC = () => {
  const {
    users,
    isLoading: isLoadingUsers,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useManagementStore();

  // Get hotel data and logged-in user's info
  const { hotels, fetchHotels, getHotelNameById } = useHotelStore();
  const loggedInUser = useAuthStore((state) => state.user);
  const currentAdminId = loggedInUser?._id;

  // Check if the logged-in user is a Super Admin (no hotelId)
  const isSuperAdmin = loggedInUser && !loggedInUser.hotelId;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagementUser | null>(null);

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin) {
      // Only fetch hotels if the user is a Super Admin
      fetchHotels();
    }
  }, [fetchUsers, fetchHotels, isSuperAdmin]);

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: ManagementUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: ManagementUser) => {
    if (user._id === currentAdminId) {
      alert("You cannot deactivate your own account.");
      return;
    }
    const action = user.isActive ? 'deactivate' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) {
      deleteUser(user._id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const hotelId = formData.get('hotelId') as string; // <-- ADDED

    if (!fullName || !username || !role) {
      alert('Full Name, Username, and Role are required.');
      return;
    }



    if (editingUser) {
      if (editingUser._id === currentAdminId && editingUser.role === 'admin' && role !== 'admin') {
        alert("You cannot remove your own admin role.");
        return;
      }
      // <-- MODIFIED: Pass hotelId
      updateUser(editingUser._id, { fullName, username, role, hotelId: hotelId || undefined });
    } else {
      if (!password) {
        alert('Password is required for new users.');
        return;
      }
      // <-- MODIFIED: Pass hotelId
      createUser({ fullName, username, password, role, hotelId: hotelId || undefined });
    }
    closeModal();
  };

  if (isLoadingUsers && users.length === 0) {
    return <p className="text-center text-gray-500">Loading users...</p>;
  }

  return (
    <div style={{ color: '#650933' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#650933] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Add User
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {users.map(user => (
            <li key={user._id} className="flex items-center justify-between p-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800">{user.fullName}</span>
                <span className="text-sm text-gray-500 ml-2">(@{user.username})</span>
                <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">
                  {user.role.replace('_', ' ')}
                </span>
                {/* <-- ADDED: Display hotel name --> */}
                {user.hotelId && (
                  <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Home size={12} />
                    {getHotelNameById(user.hotelId)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700" title="Edit">
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className={`p-1 ${user._id === currentAdminId ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                  title={user.isActive ? 'Deactivate' : 'Reactivate'}
                  disabled={user._id === currentAdminId}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* --- MODAL FOR CREATE/EDIT --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text" name="fullName" id="fullName"
              defaultValue={editingUser?.fullName || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#650933] focus:ring-[#650933] py-2 px-4"
              required autoFocus
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text" name="username" id="username"
              defaultValue={editingUser?.username || ''}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-4 shadow-sm focus:border-[#650933] focus:ring-[#650933]"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role" id="role"
              defaultValue={editingUser?.role || 'viewer'}
              className="mt-1 block py-2 px-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={editingUser?._id === currentAdminId && editingUser?.role === 'admin'}
            >
              <option value="viewer">Manager (Viewer)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* <-- ADDED: Hotel selection dropdown --> */}
          {/* This only appears if you are a Super Admin */}
          {isSuperAdmin && (
            <div>
              <label htmlFor="hotelId" className="block text-sm font-medium text-gray-700">
                Hotel
              </label>
              <select
                name="hotelId" id="hotelId"
                defaultValue={editingUser?.hotelId || ''}
                className="mt-1 block py-2 px-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Assign a Hotel...</option>
                {/* Staff roles must have a hotel. Admin/Viewer can be global. */}
                {/* <option value="">None (Global Admin/Viewer)</option> */}
                {hotels.map(hotel => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hotel Admins are created by assigning a hotel and setting role to 'Admin'.
              </p>
            </div>
          )}
          {/* <-- END: Hotel selection dropdown --> */}


          {!editingUser && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password" name="password" id="password"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-4 shadow-sm focus:border-[#650933] focus:ring-[#650933]"
                required
              />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#650933] text-white hover:bg-opacity-90">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;