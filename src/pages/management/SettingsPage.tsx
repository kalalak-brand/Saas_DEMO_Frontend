// src/pages/management/SettingsPage.tsx
import React, { useState, useCallback } from 'react';
import { Settings, Palette, Star, RotateCcw, Check, Layout, Table } from 'lucide-react';
import { useSettingsStore, ThemeConfig, ReviewDesign } from '../../stores/settingsStore';
import { Button, Card, Input } from '../../components/ui';
import clsx from 'clsx';
import toast from 'react-hot-toast';

/**
 * Color preset options for theme
 */
const colorPresets = [
    { name: 'Navy Blue', primary: '#1e3a5f', accent: '#c9a962' },
    { name: 'Forest Green', primary: '#1d4d4f', accent: '#d4a574' },
    { name: 'Royal Purple', primary: '#4a3f6b', accent: '#e8b87d' },
    { name: 'Charcoal', primary: '#2d3436', accent: '#fdcb6e' },
    { name: 'Ocean Blue', primary: '#0c3547', accent: '#f0c27b' },
    { name: 'Burgundy', primary: '#6b2d3a', accent: '#dbb88e' },
];

/**
 * Settings Page Component
 * Allows admin to configure rating scale and theme
 */
const SettingsPage: React.FC = () => {
    const {
        ratingScale,
        reviewDesign,
        theme,
        setRatingScale,
        setReviewDesign,
        setTheme,
        resetTheme,
    } = useSettingsStore();

    // Local state for form
    const [localTheme, setLocalTheme] = useState<ThemeConfig>(theme);
    const [hasChanges, setHasChanges] = useState(false);

    // Design options for review pages
    const designOptions: { id: ReviewDesign; name: string; description: string; icon: React.ReactNode }[] = [
        { id: 'classic', name: 'Classic Table', description: 'Traditional table layout with radio buttons', icon: <Table className="h-6 w-6" /> },
        { id: 'star-rating', name: 'Star Rating', description: 'Modern cards with animated star ratings', icon: <Star className="h-6 w-6" /> },
        { id: 'modern', name: 'Modern Minimal', description: 'Clean, minimal design with large buttons', icon: <Layout className="h-6 w-6" /> },
    ];

    // Handle rating scale change
    const handleRatingScaleChange = useCallback((scale: 5 | 10) => {
        setRatingScale(scale);
        toast.success(`Rating scale updated to 1-${scale}`);
    }, [setRatingScale]);

    // Handle design change
    const handleDesignChange = useCallback((design: ReviewDesign) => {
        setReviewDesign(design);
        toast.success(`Review design changed to ${design}`);
    }, [setReviewDesign]);

    // Handle theme color change
    const handleColorChange = useCallback((key: 'primaryColor' | 'accentColor', value: string) => {
        setLocalTheme((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    }, []);

    // Handle preset selection
    const handlePresetSelect = useCallback((preset: typeof colorPresets[0]) => {
        setLocalTheme((prev) => ({
            ...prev,
            primaryColor: preset.primary,
            accentColor: preset.accent,
        }));
        setHasChanges(true);
    }, []);

    // Handle message changes
    const handleMessageChange = useCallback((key: 'welcomeMessage' | 'thankYouMessage', value: string) => {
        setLocalTheme((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    }, []);

    // Save theme changes
    const handleSaveTheme = useCallback(() => {
        setTheme(localTheme);
        setHasChanges(false);
        toast.success('Theme settings saved successfully');
    }, [localTheme, setTheme]);

    // Reset to defaults
    const handleResetTheme = useCallback(() => {
        resetTheme();
        setLocalTheme(useSettingsStore.getState().theme);
        setHasChanges(false);
        toast.success('Theme reset to defaults');
    }, [resetTheme]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary-100">
                    <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                    <p className="text-text-secondary">Configure rating scale and theme appearance</p>
                </div>
            </div>

            {/* Rating Scale Section */}
            <Card padding="lg">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2.5 rounded-lg bg-accent-50">
                        <Star className="h-5 w-5 text-accent-dark" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Rating Scale</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Choose the rating scale for guest feedback forms
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    {/* 1-5 Scale Option */}
                    <button
                        onClick={() => handleRatingScaleChange(5)}
                        className={clsx(
                            'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                            ratingScale === 5
                                ? 'border-primary bg-primary-50 shadow-sm'
                                : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-primary">1-5 Scale</span>
                            {ratingScale === 5 && (
                                <div className="p-1 rounded-full bg-primary">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-1.5 mb-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div
                                    key={n}
                                    className={clsx(
                                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium',
                                        ratingScale === 5
                                            ? 'bg-primary text-white'
                                            : 'bg-surface-elevated text-text-secondary'
                                    )}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-text-muted">Simpler, faster for guests</p>
                    </button>

                    {/* 1-10 Scale Option */}
                    <button
                        onClick={() => handleRatingScaleChange(10)}
                        className={clsx(
                            'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                            ratingScale === 10
                                ? 'border-primary bg-primary-50 shadow-sm'
                                : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-primary">1-10 Scale</span>
                            {ratingScale === 10 && (
                                <div className="p-1 rounded-full bg-primary">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-1 mb-2 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <div
                                    key={n}
                                    className={clsx(
                                        'w-6 h-6 rounded flex items-center justify-center text-xs font-medium',
                                        ratingScale === 10
                                            ? 'bg-primary text-white'
                                            : 'bg-surface-elevated text-text-secondary'
                                    )}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-text-muted">More granular feedback</p>
                    </button>
                </div>
            </Card>

            {/* Review Design Section */}
            <Card padding="lg">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2.5 rounded-lg bg-purple-100">
                        <Layout className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Review Page Design</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Select the design style for your guest feedback forms
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {designOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleDesignChange(option.id)}
                            className={clsx(
                                'p-5 rounded-xl border-2 transition-all duration-200 text-left',
                                reviewDesign === option.id
                                    ? 'border-primary bg-primary-50 shadow-sm'
                                    : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                            )}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={clsx(
                                    'p-2 rounded-lg',
                                    reviewDesign === option.id ? 'bg-primary text-white' : 'bg-surface-elevated text-text-secondary'
                                )}>
                                    {option.icon}
                                </div>
                                {reviewDesign === option.id && (
                                    <div className="p-1 rounded-full bg-primary ml-auto">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-text-primary mb-1">{option.name}</h3>
                            <p className="text-xs text-text-muted">{option.description}</p>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Theme Customization Section */}
            <Card padding="lg">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2.5 rounded-lg bg-primary-100">
                        <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Theme Colors</h2>
                                <p className="text-sm text-text-secondary mt-1">
                                    Customize the appearance of your review pages
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<RotateCcw className="h-4 w-4" />}
                                onClick={handleResetTheme}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Color Presets */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                        Quick Presets
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetSelect(preset)}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                                    localTheme.primaryColor === preset.primary
                                        ? 'border-primary bg-primary-50'
                                        : 'border-border hover:border-primary-200'
                                )}
                                title={preset.name}
                            >
                                <div className="flex gap-1">
                                    <div
                                        className="w-5 h-5 rounded-full ring-1 ring-white shadow-sm"
                                        style={{ backgroundColor: preset.primary }}
                                    />
                                    <div
                                        className="w-5 h-5 rounded-full ring-1 ring-white shadow-sm"
                                        style={{ backgroundColor: preset.accent }}
                                    />
                                </div>
                                <span className="text-sm text-text-secondary">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={localTheme.primaryColor}
                                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                            />
                            <Input
                                value={localTheme.primaryColor}
                                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                                className="flex-1 font-mono uppercase"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Accent Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={localTheme.accentColor}
                                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                            />
                            <Input
                                value={localTheme.accentColor}
                                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                                className="flex-1 font-mono uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                        Live Preview
                    </label>
                    <div
                        className="p-6 rounded-xl"
                        style={{ backgroundColor: localTheme.primaryColor }}
                    >
                        <div className="text-white font-semibold mb-2">Header Preview</div>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                style={{
                                    backgroundColor: localTheme.accentColor,
                                    color: localTheme.primaryColor,
                                }}
                            >
                                Accent Button
                            </button>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white">
                                Secondary
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                {hasChanges && (
                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button onClick={handleSaveTheme} leftIcon={<Check className="h-4 w-4" />}>
                            Save Theme Changes
                        </Button>
                    </div>
                )}
            </Card>

            {/* Messages Section */}
            <Card padding="lg">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Custom Messages</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Welcome Message
                        </label>
                        <textarea
                            value={localTheme.welcomeMessage}
                            onChange={(e) => handleMessageChange('welcomeMessage', e.target.value)}
                            rows={3}
                            className="input resize-none"
                            placeholder="Enter welcome message for guests..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Thank You Message
                        </label>
                        <textarea
                            value={localTheme.thankYouMessage}
                            onChange={(e) => handleMessageChange('thankYouMessage', e.target.value)}
                            rows={3}
                            className="input resize-none"
                            placeholder="Enter thank you message after submission..."
                        />
                    </div>
                </div>

                {hasChanges && (
                    <div className="flex justify-end pt-4 mt-4 border-t border-border">
                        <Button onClick={handleSaveTheme} leftIcon={<Check className="h-4 w-4" />}>
                            Save Changes
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SettingsPage;
