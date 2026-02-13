// src/components/theme/ThemeProvider.tsx
import React, { useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { useSettingsStore, ThemeConfig } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';

/**
 * Theme context for accessing theme values in components
 */
interface ThemeContextValue {
    theme: ThemeConfig;
    setTheme: (theme: Partial<ThemeConfig>) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Props for ThemeProvider
 */
interface ThemeProviderProps {
    children: ReactNode;
}

/**
 * Color manipulation utilities
 */
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Generate color variants from a base color
 */
const generateColorVariants = (baseColor: string) => {
    const hsl = hexToHsl(baseColor);
    return {
        base: baseColor,
        light: hslToHex(hsl.h, Math.max(hsl.s - 10, 0), Math.min(hsl.l + 15, 90)),
        dark: hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 15, 10)),
        50: hslToHex(hsl.h, Math.max(hsl.s - 30, 10), 97),
        100: hslToHex(hsl.h, Math.max(hsl.s - 20, 15), 92),
        200: hslToHex(hsl.h, Math.max(hsl.s - 10, 20), 85),
    };
};

/**
 * ThemeProvider component
 * Injects CSS variables for runtime theming based on settings store
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { theme, setTheme, resetTheme, fetchSettings } = useSettingsStore();
    const token = useAuthStore((state) => state.token);

    // Only fetch settings when user is authenticated
    useEffect(() => {
        if (token) {
            fetchSettings();
        }
    }, [token, fetchSettings]);

    // Generate CSS variables from theme
    const cssVariables = useMemo(() => {
        const primaryVariants = generateColorVariants(theme.primaryColor);
        const accentVariants = generateColorVariants(theme.accentColor);

        return {
            '--color-primary': primaryVariants.base,
            '--color-primary-light': primaryVariants.light,
            '--color-primary-dark': primaryVariants.dark,
            '--color-primary-50': primaryVariants[50],
            '--color-primary-100': primaryVariants[100],
            '--color-primary-200': primaryVariants[200],
            '--color-accent': accentVariants.base,
            '--color-accent-light': accentVariants.light,
            '--color-accent-dark': accentVariants.dark,
            '--color-accent-50': accentVariants[50],
            '--color-accent-100': accentVariants[100],
        };
    }, [theme.primaryColor, theme.accentColor]);

    // Apply CSS variables to document root
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(cssVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Apply font family
        const fontMap: Record<string, string> = {
            inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
            playfair: "'Playfair Display', ui-serif, Georgia, serif",
            system: 'ui-sans-serif, system-ui, sans-serif',
        };
        root.style.setProperty('--font-sans', fontMap[theme.fontFamily] || fontMap.inter);

        // Cleanup on unmount
        return () => {
            Object.keys(cssVariables).forEach((property) => {
                root.style.removeProperty(property);
            });
        };
    }, [cssVariables, theme.fontFamily]);

    const contextValue = useMemo(
        () => ({
            theme,
            setTheme,
            resetTheme,
        }),
        [theme, setTheme, resetTheme]
    );

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
