/**
 * ImageCropModal Component
 *
 * Production-grade image cropping modal using react-easy-crop.
 * Renders a full-screen overlay with:
 *   - Visual crop area with configurable aspect ratio
 *   - Zoom slider
 *   - Cancel / Confirm buttons
 *
 * All cropping is performed client-side via <canvas>.
 * Only the final cropped Blob is returned — no server round-trip for the crop.
 *
 * Time: O(width * height) for canvas pixel manipulation
 * Space: O(width * height) for the output image buffer
 */
import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropModalProps {
    /** Object URL of the selected image */
    imageSrc: string;
    /** Aspect ratio for the crop area (default 1 = square) */
    aspect?: number;
    /** Called with the cropped image Blob on confirm */
    onCropComplete: (croppedBlob: Blob) => void;
    /** Called when the user cancels */
    onCancel: () => void;
}

/**
 * Crop an image using canvas API.
 * Takes the original image and the pixel crop area, returns a Blob.
 *
 * Time:  O(cropWidth * cropHeight) — pixel-by-pixel drawImage
 * Space: O(cropWidth * cropHeight) — canvas buffer
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    const loaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image'));
    });
    image.src = imageSrc;
    await loaded;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Output size: use crop dimensions, cap at 512px for logo (keeps file small)
    const MAX_SIZE = 512;
    const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height, 1);
    canvas.width = Math.round(pixelCrop.width * scale);
    canvas.height = Math.round(pixelCrop.height * scale);

    // High-quality resampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            },
            'image/webp',
            0.9 // High quality WebP
        );
    });
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    imageSrc,
    aspect = 1,
    onCropComplete,
    onCancel,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((_: unknown, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedBlob);
        } catch {
            // Fallback: if crop fails, use original image as-is
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            onCropComplete(blob);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Crop Logo</h3>
                    <button
                        onClick={onCancel}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="relative w-full h-[300px] md:h-[350px] bg-gray-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropChange}
                        cropShape="rect"
                        showGrid={false}
                        style={{
                            containerStyle: { borderRadius: 0 },
                            cropAreaStyle: {
                                border: '3px solid #fff',
                                borderRadius: '12px',
                            },
                        }}
                    />
                </div>

                {/* Zoom Control */}
                <div className="flex items-center gap-3 px-6 py-4">
                    <ZoomOut size={18} className="text-gray-400 flex-shrink-0" />
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-indigo-600 h-1.5 rounded-full cursor-pointer"
                    />
                    <ZoomIn size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-5 pb-5">
                    <button
                        onClick={onCancel}
                        disabled={processing}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : (
                            <>
                                <Check size={18} />
                                Crop & Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
