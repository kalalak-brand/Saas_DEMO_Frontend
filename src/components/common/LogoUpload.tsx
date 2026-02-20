/**
 * LogoUpload Component
 *
 * Reusable hotel logo uploader for super_admin users.
 * - Displays current logo or "LOGO" text fallback
 * - Click to select file, shows preview, upload with progress
 * - Delete button to remove existing logo
 *
 * Props:
 *   hotelId  — ID of the hotel whose logo is managed
 *   logoUrl  — current logo URL (or undefined)
 *   onLogoChange — callback after upload/delete with the updated hotel
 */
import React, { useRef, useState } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useHotelStore } from '../../stores/hotelStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface LogoUploadProps {
    hotelId: string;
    logoUrl?: string;
    onLogoChange?: (hotel: { logo?: { url: string; publicId: string } } | null) => void;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
    sm: 'w-12 h-12 text-[10px]',
    md: 'w-20 h-20 text-sm',
    lg: 'w-28 h-28 text-base',
};

const LogoUpload: React.FC<LogoUploadProps> = ({
    hotelId,
    logoUrl,
    onLogoChange,
    size = 'md',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const { uploadLogo, deleteLogo } = useHotelStore();
    const { updateHotelLogo } = useAuthStore();
    const userRole = useAuthStore((s) => s.user?.role);
    const isSuperAdmin = userRole === 'super_admin';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be under 2 MB');
            return;
        }

        setUploading(true);
        try {
            const hotel = await uploadLogo(hotelId, file);
            if (hotel) {
                toast.success('Logo uploaded!');
                updateHotelLogo(hotel.logo);
                onLogoChange?.(hotel);
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!confirm('Remove the hotel logo?')) return;
        setUploading(true);
        try {
            const hotel = await deleteLogo(hotelId);
            if (hotel) {
                toast.success('Logo removed');
                updateHotelLogo(undefined);
                onLogoChange?.(hotel);
            }
        } catch {
            toast.error('Delete failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Logo Preview / Fallback */}
            <div
                className={`${SIZE_MAP[size]} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative group cursor-pointer`}
                onClick={() => isSuperAdmin && !uploading && fileInputRef.current?.click()}
                title={isSuperAdmin ? 'Click to upload logo' : 'Hotel logo'}
            >
                {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : logoUrl ? (
                    <img
                        src={logoUrl}
                        alt="Hotel logo"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="tracking-wider">LOGO</span>
                )}

                {/* Hover overlay for super_admin */}
                {isSuperAdmin && !uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Delete button — only shown to super_admin when logo exists */}
            {isSuperAdmin && logoUrl && !uploading && (
                <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="Remove logo"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    );
};

export default LogoUpload;
