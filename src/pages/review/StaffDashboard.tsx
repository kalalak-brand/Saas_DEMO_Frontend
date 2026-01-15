import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/Kalalak.png';
import { useAuthStore, getCategoryFromRole } from '../../stores/authStore';
import { LogOut, Link, Edit } from 'lucide-react';

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const role = user?.role || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic navigation based on category extracted from role
  const handleNavigate = () => {
    const category = getCategoryFromRole(role);
    if (category) {
      // Navigate to the category-specific review page
      navigate(`/review/${category}`);
    } else {
      // Generic 'staff' role - let them select a category
      navigate('/review/select');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-colors"
        title="Logout"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 space-y-8 text-center">
        <img src={logo} alt="Oshin Logo" className="w-24 mx-auto" />
        <h2 className="text-3xl font-bold text-[#650933]">
          Welcome, {user?.fullName || 'Staff'}!
        </h2>
        <p className="text-lg text-gray-600">
          What would you like to do?
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <button
            onClick={handleNavigate}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-primary text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all"
          >
            <Edit size={48} />
            <span className="text-2xl font-semibold">Submit Staff Review</span>
          </button>
          <button
            onClick={() => navigate('/review/generate')}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all"
          >
            <Link size={48} />
            <span className="text-2xl font-semibold">Generate Guest Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;