/**
 * LogoUpload Component
 *
 * Production-grade hotel logo uploader with image crop support.
 * Flow: Select file → Crop modal (1:1 square) → Upload cropped Blob to Cloudinary
 *
 * Props:
 *   hotelId     — ID of the hotel whose logo is managed
 *   logoUrl     — current logo URL (or undefined)
 *   onLogoChange — callback after upload/delete with the updated hotel
 *   size        — display size variant
 */
import React, { useRef, useState, useCallback } from 'react';
import { Trash2, Loader2, Camera } from 'lucide-react';
import { useHotelStore } from '../../stores/hotelStore';
import { useAuthStore } from '../../stores/authStore';
import ImageCropModal from './ImageCropModal';
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

// Max file size: 5 MB (before crop; cropped output is much smaller)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const LogoUpload: React.FC<LogoUploadProps> = ({
    hotelId,
    logoUrl,
    onLogoChange,
    size = 'md',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const { uploadLogo, deleteLogo } = useHotelStore();
    const { updateHotelLogo } = useAuthStore();
    const userRole = useAuthStore((s) => s.user?.role);
    const isSuperAdmin = userRole === 'super_admin';

    // Crop modal state
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    /**
     * Open file picker → validate → show crop modal
     * Time: O(1), Space: O(file_size) for object URL
     */
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are allowed');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size must be under 5 MB');
            return;
        }

        // Create object URL and open crop modal
        const objectUrl = URL.createObjectURL(file);
        setCropSrc(objectUrl);

        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    /**
     * After cropping: convert Blob → File → upload to backend
     * Time: O(file_size) — network upload
     */
    const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
        // Clean up object URL
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);

        const croppedFile = new File([croppedBlob], 'hotel-logo.webp', { type: 'image/webp' });

        setUploading(true);
        setImgError(false);
        try {
            const hotel = await uploadLogo(hotelId, croppedFile);
            if (hotel) {
                toast.success('Logo uploaded!');
                updateHotelLogo(hotel.logo);
                onLogoChange?.(hotel);
            }
        } catch {
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [cropSrc, hotelId, uploadLogo, updateHotelLogo, onLogoChange]);

    /**
     * Cancel crop — clean up object URL
     */
    const handleCropCancel = useCallback(() => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    }, [cropSrc]);

    /**
     * Delete existing logo
     * Time: O(1) API call
     */
    const handleDelete = async () => {
        if (!confirm('Remove the hotel logo?')) return;
        setUploading(true);
        try {
            const hotel = await deleteLogo(hotelId);
            if (hotel) {
                toast.success('Logo removed');
                updateHotelLogo(undefined);
                setImgError(false);
                onLogoChange?.(hotel);
            }
        } catch {
            toast.error('Delete failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                {/* Logo Preview / Fallback */}
                <div
                    className={`${SIZE_MAP[size]} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative group cursor-pointer`}
                    onClick={() => isSuperAdmin && !uploading && fileInputRef.current?.click()}
                    title={isSuperAdmin ? 'Click to upload logo' : 'Hotel logo'}
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : logoUrl && !imgError ? (
                        <img
                            src={logoUrl}
                            alt="Hotel logo"
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="tracking-wider">LOGO</span>
                    )}

                    {/* Hover overlay for super_admin */}
                    {isSuperAdmin && !uploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1">
                            <Camera className="w-5 h-5 text-white" />
                            <span className="text-[9px] text-white/80 font-medium">
                                {logoUrl ? 'Change' : 'Upload'}
                            </span>
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

            {/* Crop Modal */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
};

export default LogoUpload;
