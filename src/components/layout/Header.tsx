//components/layout/header.tsx
import { Menu, Settings } from "lucide-react";
import { FaDownload, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import YearlyReportModal from '../common/YearlyReportModal';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export const Header = ({ toggleSidebar, isMobile }: HeaderProps) => {
  const openModal = useReportStore((state) => state.openModal);
  const { user } = useAuthStore();

  // Show management link for admin and super_admin roles
  const canAccessManagement = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      <header className="bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-1">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <span className="hidden md:inline text-xl text-gray-500 font-semibold">Dashboards <span className="mx-1 text-gray-400">/</span> Menu</span>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-44 md:w-72">
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-sm"
                placeholder="Search"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Management Link for Admin/Super Admin */}
            {canAccessManagement && (
              <Link
                to="/management/questions"
                className="flex items-center gap-2 font-semibold text-primary hover:text-primary/75 transition-colors"
                title="Form Builder & Settings"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden md:inline">Management</span>
              </Link>
            )}
            <button onClick={openModal} title="Download Yearly Report" className="flex gap-4 font-semibold">
              Download
              <FaDownload className="text-xl text-primary hover:text-primary/75 cursor-pointer" />
            </button>
          </div>
        </div>
      </header>

      <YearlyReportModal />
    </>
  );
};