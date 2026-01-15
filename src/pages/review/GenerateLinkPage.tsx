import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTokenStore } from '../../stores/tokenStore';
import { useAuthStore, getCategoryFromRole, isAdminRole } from '../../stores/authStore';
import { useCategoryStore, useActiveCategories } from '../../stores/categoryStore';
import { LogOut, ArrowLeft, Copy, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GenerateLinkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { generatedToken, isLoading, error, generateToken, clearToken } = useTokenStore();
  const activeCategories = useActiveCategories();
  const { fetchCategories } = useCategoryStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const publicUrl = window.location.origin;

  // Fetch categories if needed
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Initialize selected category based on role
  useEffect(() => {
    if (!user || activeCategories.length === 0) return;

    const role = user.role;
    if (isAdminRole(role)) {
      // Default to first category for admin if not set
      if (!selectedCategoryId) {
        setSelectedCategoryId(activeCategories[0]._id);
      }
    } else {
      // Staff: find their assigned category
      const slug = getCategoryFromRole(role);
      if (slug) {
        const cat = activeCategories.find(c => c.slug === slug);
        if (cat) setSelectedCategoryId(cat._id);
      }
    }
  }, [user, activeCategories, selectedCategoryId]);

  useEffect(() => {
    clearToken();
  }, [clearToken]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFullLink = () => {
    if (!generatedToken) return '';
    return `${publicUrl}/public/review/${encodeURIComponent(generatedToken)}`;
  };

  const handleCopyToClipboard = () => {
    const link = getFullLink();
    if (!link) return;
    try {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link.');
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'email') => {
    const link = getFullLink();
    if (!link) return;
    const message = encodeURIComponent(`Please share your feedback for Oshin Hotels: ${link}`);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    } else if (platform === 'email') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=Oshin Hotels Feedback&body=${(message)}`, '_blank');
    }
  };

  const selectedCategoryName = useMemo(() => {
    const cat = activeCategories.find(c => c._id === selectedCategoryId);
    return cat?.name || '...';
  }, [activeCategories, selectedCategoryId]);



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

      <button
        onClick={() => navigate('/review/dashboard')}
        className="absolute top-4 left-4 flex items-center gap-2 text-primary font-medium hover:underline"
        title="Back to Dashboard"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <h2 className="text-3xl font-bold text-[#650933]">Generate Guest Link</h2>

        {/* Category Selector for Admins */}
        {user && isAdminRole(user.role) && activeCategories.length > 0 && (
          <div className="flex justify-center mb-4">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-4 py-2 border rounded-lg text-lg font-medium text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {activeCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        <p className="text-lg text-gray-600">
          Generate a single-use review link for a <span className="font-bold text-primary">{selectedCategoryName}</span> guest.
        </p>

        {!generatedToken ? (
          <button
            onClick={() => generateToken(selectedCategoryId)}
            disabled={isLoading || !selectedCategoryId}
            className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoading ? 'Generating...' : 'Generate New Link'}
          </button>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-gray-100 border border-dashed border-gray-400 rounded-lg text-center">
              <p className="text-sm text-gray-600">Share this link with the guest:</p>
              <p className="text-lg font-mono break-all text-primary my-2">{getFullLink()}</p>
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy size={18} />
                Copy Link
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button
                onClick={() => handleShare('email')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
              >
                <Mail size={18} /> Email
              </button>
            </div>

            <button
              onClick={() => generateToken(selectedCategoryId)} // Re-generate
              disabled={isLoading || !selectedCategoryId}
              className="w-full px-8 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Another Link'}
            </button>
          </div>
        )}

        {error && <p className="text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default GenerateLinkPage;