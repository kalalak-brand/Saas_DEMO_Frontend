import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Building2, ChevronRight, Loader2, LogOut } from 'lucide-react';
import apiClient from '../utils/apiClient';

/**
 * Interface representing a Hotel
 */
interface Hotel {
    _id: string;
    name: string;
    code: string;
    address?: string;
    logo?: { url: string };
    isActive: boolean;
}

const HotelSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, setSelectedHotel } = useAuthStore();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchHotels = async () => {
            try {
                const res = await apiClient.get('/hotels', { params: { active: true } });

                let fetchedHotels: Hotel[] = res.data?.data?.hotels || [];

                // Owner and GM are filtered to their allowedHotels only.
                // Time: O(n) where n = total hotels (small bounded set)
                const isAllowedHotelsRole = user?.role === 'hotel_owner' || user?.role === 'hotel_gm';
                if (isAllowedHotelsRole && user?.allowedHotels && user.allowedHotels.length > 0) {
                    fetchedHotels = fetchedHotels.filter((hotel) =>
                        user.allowedHotels!.some((allowedHotel) =>
                            (typeof allowedHotel === 'string' ? allowedHotel : allowedHotel._id) === hotel._id
                        )
                    );
                }

                if (!mounted) return;

                setHotels(fetchedHotels);

                // Auto-redirect if the user's last selected hotel is still available
                const lastSelectedHotelId = localStorage.getItem('lastSelectedHotelId');
                const lastSelected = lastSelectedHotelId
                    ? fetchedHotels.find(h => h._id === lastSelectedHotelId)
                    : undefined;

                if (lastSelected) {
                    handleSelectHotel(lastSelected);
                    return;
                }

                // Auto-redirect if only one hotel is available (e.g. single-property Owner)
                if (fetchedHotels.length === 1) {
                    handleSelectHotel(fetchedHotels[0]);
                } else {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch hotels", err);
                if (mounted) setIsLoading(false);
            }
        };

        fetchHotels();
        return () => { mounted = false; };
    }, [navigate, setSelectedHotel, user]);

    const handleSelectHotel = (hotel: Hotel) => {
        // Persist working hotel selection into auth store + localStorage
        setSelectedHotel(hotel);
        
        // Owner/GM land on feedback analytics dashboard (composite graphs)
        // The IndexRedirect at "/" fetches composites and navigates to /view/:itemId
        navigate('/');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Loading assigned properties...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Select Property</h1>
                        <p className="text-gray-500 mt-2">
                            Welcome back, <span className="capitalize font-medium text-gray-700">{user?.fullName || 'User'}</span>.{' '}
                            Select a hotel location to manage operations.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-medium"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Hotel Grid */}
                {hotels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hotels.map(hotel => (
                            <button
                                key={hotel._id}
                                onClick={() => handleSelectHotel(hotel)}
                                className="group relative flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E4B587] to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="p-6">
                                    <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl mb-4 flex items-center justify-center shadow-inner overflow-hidden">
                                        {hotel.logo?.url ? (
                                            <img src={hotel.logo.url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-primary/60" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                        {hotel.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-medium">
                                        {hotel.code}
                                    </p>
                                    
                                    <div className="mt-6 flex items-center justify-between text-sm font-medium text-primary">
                                        <span>Enter Dashboard</span>
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Assigned</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Your account is not currently assigned to any active hotels. Please contact your system administrator.
                        </p>
                    </div>
                )}
                
            </div>
        </div>
    );
};

export default HotelSelectionPage;
