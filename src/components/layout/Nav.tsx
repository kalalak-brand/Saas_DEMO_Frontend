//components/layout/Nav.tsx
import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import { useActiveCategories } from "../../stores/categoryStore";
import apiClient from "../../utils/apiClient";

interface NavProps {
  category: string;
  setCategory: (category: string) => void;
}

function Nav({ category, setCategory }: NavProps) {
  const { user, updateHotelLogo } = useAuthStore();
  const activeCategories = useActiveCategories();

  // Logo from auth store (set at login or after upload)
  const authLogoUrl = user?.hotelId?.logo?.url;
  const hotelId = user?.hotelId?._id;
  const hotelName = user?.hotelId?.name || '';

  // Hotel initials for fallback (e.g., "Kalalak Hotel Calicut" → "KH")
  // Time: O(words), Space: O(1)
  const hotelInitials = hotelName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  // Fetch latest hotel logo from backend on mount to catch post-login uploads
  // Time: O(1) API call, Space: O(1)
  const [logoUrl, setLogoUrl] = useState<string | undefined>(authLogoUrl);
  const [imgError, setImgError] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(!authLogoUrl && !!hotelId);

  useEffect(() => {
    // Sync if auth store updates (e.g. after LogoUpload component calls updateHotelLogo)
    setLogoUrl(authLogoUrl);
    setImgError(false);
  }, [authLogoUrl]);

  useEffect(() => {
    if (!hotelId) return;
    // Skip fetch if we already have the logo from auth store
    if (authLogoUrl) {
      setIsLoadingLogo(false);
      return;
    }

    let cancelled = false;
    setIsLoadingLogo(true);
    apiClient
      .get(`/hotels/${hotelId}`)
      .then((res) => {
        if (cancelled) return;
        const freshLogo = res.data?.data?.hotel?.logo;
        if (freshLogo?.url) {
          setLogoUrl(freshLogo.url);
          // Keep auth store in sync so other components also see the latest logo
          updateHotelLogo(freshLogo);
        }
      })
      .catch(() => {
        // Silently fall back to initials
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLogo(false);
      });

    return () => { cancelled = true; };
  }, [hotelId, authLogoUrl, updateHotelLogo]);

  // Render logo area
  const renderLogo = () => {
    // Loading skeleton
    if (isLoadingLogo) {
      return (
        <div className="w-[50px] h-[50px] rounded-xl bg-gray-200 animate-pulse" />
      );
    }

    // Logo image available
    if (logoUrl && !imgError) {
      return (
        <img
          src={logoUrl}
          width={50}
          alt={hotelName || 'Hotel Logo'}
          className="rounded-xl object-contain h-[50px] shadow-sm border border-gray-100"
          onError={() => setImgError(true)}
        />
      );
    }

    // Initials fallback
    return (
      <div className="w-[50px] h-[50px] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
        {hotelInitials || 'H'}
      </div>
    );
  };

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-2 border-b border-gray-200 bg-background">

      <div className="flex items-center gap-4">
        {renderLogo()}
      </div>

      {/* Dynamic category filter buttons */}
      {(user?.role === 'admin' || user?.role === 'viewer') && activeCategories.length > 0 && (
        <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg overflow-x-auto">
          {activeCategories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${category === cat.slug
                ? 'bg-primary text-white shadow'
                : 'text-gray-700 hover:bg-gray-300'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center gap-4">
        <FaUserCircle className="text-3xl text-pink-700" />
        <p className="text-[#949CA1] capitalize">{user?.fullName || 'User'}</p>
      </div>
    </div>
  );
}

export default Nav;

