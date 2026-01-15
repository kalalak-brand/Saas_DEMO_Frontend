//components/layout/Nav.tsx
import logo from "../../assets/logo/Kalalak.png";
import { FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import { useActiveCategories } from "../../stores/categoryStore";

interface NavProps {
  category: string;
  setCategory: (category: string) => void;
}

function Nav({ category, setCategory }: NavProps) {
  const { user } = useAuthStore();
  const activeCategories = useActiveCategories();

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-2 border-b border-gray-200 bg-background">

      <div className="flex items-center gap-4">
        <img src={logo} width={50} alt="Logo" />
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