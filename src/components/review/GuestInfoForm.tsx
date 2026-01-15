/**
 * GuestInfoForm Component
 * Reusable form for collecting guest information in review pages
 */
import React from 'react';
import { GuestInfoFields } from '../../stores/categoryStore';

export interface GuestInfo {
    name: string;
    phone: string;
    roomNumber?: string;
}

export interface GuestInfoFormProps {
    guestInfo: GuestInfo;
    description: string;
    guestInfoFields?: GuestInfoFields;
    onChange: (field: keyof GuestInfo, value: string) => void;
    onDescriptionChange: (value: string) => void;
    primaryColor?: string;
    disabled?: boolean;
}

/**
 * GuestInfoForm - Collects guest name, phone, room number (conditional), and description
 */
export const GuestInfoForm: React.FC<GuestInfoFormProps> = ({
    guestInfo,
    description,
    guestInfoFields,
    onChange,
    onDescriptionChange,
    primaryColor = '#1e3a5f',
    disabled = false,
}) => {
    const handlePhoneChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        onChange('phone', numericValue);
    };

    return (
        <div className="space-y-4">
            {/* Name Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                    type="text"
                    value={guestInfo.name}
                    onChange={e => onChange('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="Enter your name"
                    disabled={disabled}
                />
            </div>

            {/* Phone Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp No *</label>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={guestInfo.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                    placeholder="10-digit phone number"
                    maxLength={10}
                    disabled={disabled}
                />
            </div>

            {/* Room Number - Conditional based on guestInfoFields */}
            {guestInfoFields?.roomNumber && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                        type="text"
                        value={guestInfo.roomNumber || ''}
                        onChange={e => onChange('roomNumber', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                        placeholder="e.g., 101"
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Description / Additional Comments */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Comments
                </label>
                <textarea
                    value={description}
                    onChange={e => onDescriptionChange(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent resize-none"
                    placeholder="Any additional feedback or memorable experiences..."
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

export default GuestInfoForm;
