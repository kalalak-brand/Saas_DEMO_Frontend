/**
 * Common TypeScript types shared across the application
 */

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================
// Entity Types
// ============================================

/**
 * Base entity with common fields
 */
export interface BaseEntity {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Question entity
 */
export interface Question extends BaseEntity {
    text: string;
    questionType: 'rating' | 'yes_no';
    category: string;
    isActive?: boolean;
    order?: number;
}

/**
 * Answer payload for review submission
 */
export interface AnswerPayload {
    question: string;
    rating?: number;
    answerBoolean?: boolean;
    answerText?: string;
}

/**
 * Guest information for reviews
 */
export interface GuestInfo {
    name?: string;
    phone?: string;
    roomNumber?: string;
    email?: string;
}

/**
 * Review submission payload
 */
export interface ReviewPayload {
    category: string;
    answers: AnswerPayload[];
    description?: string;
    guestInfo?: GuestInfo;
}

/**
 * Hotel entity
 */
export interface Hotel extends BaseEntity {
    name: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
}

/**
 * User entity
 */
export interface User extends BaseEntity {
    username: string;
    role: 'admin' | 'viewer' | 'staff' | string;
    hotelId?: Hotel | string;
    isActive?: boolean;
}

// ============================================
// Analytics Types
// ============================================

/**
 * Chart data point for visualizations
 */
export interface ChartDataPoint {
    name: string;
    value: number;
}

/**
 * Analytics item type
 */
export type AnalyticsItemType = 'composite' | 'question';

/**
 * Date range for filtering
 */
export interface DateRange {
    start: string;
    end: string;
}

// ============================================
// UI Types
// ============================================

/**
 * Common loading state
 */
export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
    primaryColor: string;
    accentColor: string;
    fontFamily: 'inter' | 'playfair' | 'system';
    logoUrl: string | null;
    welcomeMessage: string;
    thankYouMessage: string;
}

/**
 * Review design options
 */
export type ReviewDesign = 'classic' | 'star-rating' | 'modern';

