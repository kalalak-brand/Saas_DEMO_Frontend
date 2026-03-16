// src/pages/review/StarRatingReviewPage.tsx
/**
 * Star Rating Review Page — Guest-facing feedback form
 *
 * Mobile-first, premium design with:
 * - Interactive star ratings with haptic-like animations
 * - Yes/No questions with "Please specify" text input on Yes
 * - Google Review redirect when all ratings ≥ 4
 * - No "Submit Another Review" button per user request
 *
 * Time: O(n) where n = questions, Space: O(n) for answers state
 */
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Star, Send, ArrowLeft, Loader2, ExternalLink, CheckCircle2, MessageSquare } from "lucide-react";
import { useReviewStore, ReviewPayload } from "../../stores/reviewStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useCategoryStore } from "../../stores/categoryStore";
import { PlaceholderLogo } from "../../components/common/PlaceholderLogo";
import toast from "react-hot-toast";
import clsx from "clsx";

/* ─────────────────────────────────
   Star Rating Component
───────────────────────────────── */
interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
    max: number;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    accentColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    max,
    size = "md",
    disabled = false,
    accentColor = "#c9a962",
}) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sizeMap = {
        sm: max > 5 ? "w-5 h-5" : "w-6 h-6",
        md: max > 5 ? "w-6 h-6" : "w-9 h-9",
        lg: max > 5 ? "w-7 h-7" : "w-11 h-11",
    };

    return (
        <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1;
                const isFilled = (hoverValue ?? value) >= starValue;

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        className={clsx(
                            "transition-all duration-200 ease-out",
                            disabled
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer active:scale-125",
                            isFilled && !disabled && "scale-110",
                        )}
                        style={{ color: isFilled ? accentColor : '#d1d5db' }}
                        onMouseEnter={() => !disabled && setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(null)}
                        onClick={() => !disabled && onChange(starValue)}
                    >
                        <Star
                            className={clsx(sizeMap[size], isFilled && "fill-current drop-shadow-sm")}
                        />
                    </button>
                );
            })}
        </div>
    );
};

/* ─────────────────────────────────
   Rating Label Helper
───────────────────────────────── */
const getRatingLabel = (value: number): string => {
    if (value <= 1) return "Very Poor";
    if (value <= 2) return "Poor";
    if (value <= 3) return "Average";
    if (value <= 4) return "Good";
    return "Excellent";
};

const getRatingColor = (value: number): string => {
    if (value <= 1) return "#ef4444";
    if (value <= 2) return "#f97316";
    if (value <= 3) return "#eab308";
    if (value <= 4) return "#22c55e";
    return "#16a34a";
};

/* ─────────────────────────────────
   Question Card Component
───────────────────────────────── */
interface QuestionCardProps {
    question: { _id: string; text: string; questionType: string };
    value: number | boolean | null;
    specifyText?: string;
    onRatingChange?: (value: number) => void;
    onBooleanChange?: (value: boolean) => void;
    onSpecifyChange?: (text: string) => void;
    accentColor?: string;
    primaryColor?: string;
    index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    value,
    specifyText = "",
    onRatingChange,
    onBooleanChange,
    onSpecifyChange,
    accentColor = "#c9a962",
    primaryColor = "#1e3a5f",
    index,
}) => {
    const isRating = question.questionType === "rating";

    return (
        <div
            className="bg-white rounded-2xl shadow-sm border p-5 mb-4 transition-all duration-300 hover:shadow-md"
            style={{
                borderColor: value !== null && value !== undefined
                    ? `${accentColor}40`
                    : '#e5e7eb',
                borderLeftWidth: '4px',
                borderLeftColor: value !== null && value !== undefined
                    ? accentColor
                    : '#e5e7eb',
            }}
        >
            {/* Question number + text */}
            <div className="flex items-start gap-3 mb-4">
                <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                >
                    {index + 1}
                </span>
                <h3 className="text-base font-medium text-gray-800 leading-snug pt-0.5">
                    {question.text}
                </h3>
            </div>

            {isRating ? (
                <div className="flex flex-col items-center gap-2">
                    <StarRating
                        value={typeof value === "number" ? value : 0}
                        onChange={onRatingChange ?? (() => { })}
                        max={5}
                        size="lg"
                        accentColor={accentColor}
                    />
                    {typeof value === "number" && value > 0 && (
                        <span
                            className="text-sm font-semibold px-3 py-1 rounded-full mt-1"
                            style={{
                                color: getRatingColor(value),
                                backgroundColor: `${getRatingColor(value)}15`,
                            }}
                        >
                            {value}/5 — {getRatingLabel(value)}
                        </span>
                    )}
                    {(value === null || value === undefined || value === 0) && (
                        <p className="text-xs text-gray-400 mt-1">Tap a star to rate</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => onBooleanChange?.(true)}
                            className={clsx(
                                "flex-1 max-w-[140px] py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-2",
                                value === true
                                    ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25 scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50 active:scale-95"
                            )}
                        >
                            ✓ Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => onBooleanChange?.(false)}
                            className={clsx(
                                "flex-1 max-w-[140px] py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-2",
                                value === false
                                    ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/25 scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50 active:scale-95"
                            )}
                        >
                            ✗ No
                        </button>
                    </div>

                    {/* "Please specify" input — shown when Yes is selected */}
                    {value === true && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative mt-2">
                                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={specifyText}
                                    onChange={e => onSpecifyChange?.(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    style={{ focusRingColor: accentColor } as React.CSSProperties}
                                    placeholder="Please specify (optional)"
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────
   Main Review Page
───────────────────────────────── */
const StarRatingReviewPage: React.FC = () => {
    const { category, hotelCode, orgSlug } = useParams<{ category: string; hotelCode: string; orgSlug?: string }>();
    const [page, setPage] = useState<"review" | "info" | "thankyou">("review");

    const { theme } = useSettingsStore();
    const { getCategoryBySlug } = useCategoryStore();

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestRoom, setGuestRoom] = useState("");
    const [description, setDescription] = useState("");
    // "Please specify" text for yes/no questions keyed by question ID
    const [specifyTexts, setSpecifyTexts] = useState<Record<string, string>>({});

    const {
        questions,
        answers,
        isLoading,
        isSubmitting,
        fetchQuestions,
        setAnswer,
        submitReview,
        resetReview,
        hotelInfo,
    } = useReviewStore();

    const currentCategory = useMemo(() => {
        return category ? getCategoryBySlug(category) : undefined;
    }, [category, getCategoryBySlug]);

    useEffect(() => {
        resetReview();
        if (category && hotelCode) {
            fetchQuestions(category, hotelCode, orgSlug);
        }
    }, [category, hotelCode, orgSlug, fetchQuestions, resetReview]);

    const { ratingQuestions, yesNoQuestions } = useMemo(() => ({
        ratingQuestions: questions.filter(q => q.questionType === "rating"),
        yesNoQuestions: questions.filter(q => q.questionType === "yes_no"),
    }), [questions]);

    const allQuestionsAnswered = useMemo(() => {
        return ratingQuestions.every(q => answers[q._id] !== null && answers[q._id] !== undefined);
    }, [ratingQuestions, answers]);

    // Check if all rating questions are ≥ 4 (for Google review redirect)
    const allRatingsHigh = useMemo(() => {
        if (ratingQuestions.length === 0) return false;
        return ratingQuestions.every(q => {
            const val = answers[q._id];
            return typeof val === "number" && val >= 4;
        });
    }, [ratingQuestions, answers]);

    // Progress percentage for the progress bar
    const progress = useMemo(() => {
        const total = ratingQuestions.length;
        if (total === 0) return 0;
        const answered = ratingQuestions.filter(q => answers[q._id] !== null && answers[q._id] !== undefined).length;
        return Math.round((answered / total) * 100);
    }, [ratingQuestions, answers]);

    const handleSubmit = async () => {
        if (!category) return;

        const answersPayload = Object.keys(answers)
            .filter(qId => answers[qId] !== null && answers[qId] !== undefined)
            .map(qId => {
                const question = questions.find(q => q._id === qId);
                const answer = answers[qId];

                if (question?.questionType === "rating") {
                    return { question: qId, rating: answer as number };
                }
                return {
                    question: qId,
                    answerBoolean: answer as boolean,
                    // Include "please specify" text if provided for Yes answers
                    answerText: (answer === true && specifyTexts[qId]?.trim())
                        ? specifyTexts[qId].trim()
                        : undefined,
                };
            });

        const hasGuestInfo = guestName.trim() || guestPhone.trim() || guestRoom.trim();

        const payload: ReviewPayload = {
            category,
            answers: answersPayload as ReviewPayload["answers"],
            description: description.trim(),
            guestInfo: hasGuestInfo ? {
                name: guestName.trim() || undefined,
                phone: guestPhone.trim() || undefined,
                roomNumber: guestRoom.trim() || undefined,
            } : undefined,
            hotelCode: hotelCode,
            orgSlug: orgSlug,
        };

        const success = await submitReview(payload);
        if (success) {
            toast.success("Thank you for your feedback!");
            setPage("thankyou");
        }
    };

    // ─── Loading State ───
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
                        style={{ backgroundColor: `${theme.primaryColor}15` }}
                    >
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primaryColor }} />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Loading your review form...</p>
                </div>
            </div>
        );
    }

    // ─── Thank You Page ───
    if (page === "thankyou") {
        const googleLink = hotelInfo?.googleReviewLink;
        const postMessage = hotelInfo?.postReviewMessage || theme.thankYouMessage || "Your feedback helps us serve you better.";

        // Check if ANY rating question got a low score (≤ 3)
        const anyRatingLow = ratingQuestions.some(q => {
            const val = answers[q._id];
            return typeof val === "number" && val <= 3;
        });

        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${
                anyRatingLow
                    ? "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
                    : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
            }`}>
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-green-100">

                    {anyRatingLow ? (
                        /* ── Low Rating (≤ 3) — Reassurance Message ── */
                        <>
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div
                                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                                    style={{ backgroundColor: '#f59e0b' }}
                                />
                                <div className="relative w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-12 h-12 text-amber-500" />
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-800 mb-3">
                                Thank You for Your Feedback
                            </h1>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 font-medium">
                                Our team will resolve this immediately.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <p className="text-amber-800 text-xs leading-relaxed">
                                    Your concerns have been forwarded to our management team and they have been notified instantly.
                                    We take every piece of feedback seriously and will act on it right away.
                                </p>
                            </div>
                        </>
                    ) : (
                        /* ── High Rating (≥ 4) — Thank You + Google Review ── */
                        <>
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div
                                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                                    style={{ backgroundColor: '#22c55e' }}
                                />
                                <div className="relative w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-800 mb-3">Thank You!</h1>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">{postMessage}</p>

                            {/* Google Review redirect — only when all ratings ≥ 4 AND link exists */}
                            {allRatingsHigh && googleLink && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-4 border border-blue-100">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    </div>
                                    <p className="text-gray-700 font-medium text-sm mb-3">
                                        We're glad you had a great experience!
                                    </p>
                                    <p className="text-gray-500 text-xs mb-4">
                                        Would you mind sharing your experience on Google? It helps other guests find us.
                                    </p>
                                    <a
                                        href={googleLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                                        style={{
                                            background: 'linear-gradient(135deg, #4285F4, #34A853)',
                                            boxShadow: '0 4px 14px rgba(66, 133, 244, 0.35)',
                                        }}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Leave a Google Review
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            )}
                        </>
                    )}

                    {/* Hotel branding */}
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Powered by <span className="font-semibold text-gray-500">Kalalak Insight</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Guest Info Page ───
    if (page === "info") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
                <div className="max-w-md mx-auto pt-2">
                    <button
                        onClick={() => setPage("review")}
                        className="flex items-center gap-1.5 text-gray-500 mb-5 text-sm font-medium hover:text-gray-800 transition-colors active:scale-95"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${theme.primaryColor}15` }}
                            >
                                <Send className="w-5 h-5" style={{ color: theme.primaryColor }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Almost Done!</h2>
                                <p className="text-xs text-gray-400">Your information helps us serve you better</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Your name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={guestPhone}
                                    onChange={e => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
                                    placeholder="10-digit phone number"
                                />
                            </div>

                            {category?.toLowerCase() === 'room' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                        Room Number
                                    </label>
                                    <input
                                        type="text"
                                        value={guestRoom}
                                        onChange={e => setGuestRoom(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
                                        placeholder="e.g., 101"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Additional Comments
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:border-transparent resize-none text-sm transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Any additional feedback..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={clsx(
                                "w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all",
                                isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            )}
                            style={!isSubmitting ? {
                                backgroundColor: theme.primaryColor,
                                boxShadow: `0 4px 14px ${theme.primaryColor}40`,
                            } : undefined}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Review
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-3">
                            All fields are optional
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main Review Page ───
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            {/* Header */}
            <header
                className="text-white px-4 pt-8 pb-10 rounded-b-[2rem] relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}dd)`,
                }}
            >
                {/* Decorative circles */}
                <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10"
                    style={{ backgroundColor: theme.accentColor }}
                />
                <div
                    className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
                    style={{ backgroundColor: theme.accentColor }}
                />

                <div className="max-w-lg mx-auto text-center relative z-10">
                    <PlaceholderLogo size="md" showText={false} />
                    <h1 className="text-xl font-bold mt-3 tracking-tight">
                        {hotelInfo?.name || "Guest Feedback"}
                    </h1>
                    {currentCategory && (
                        <p className="text-white/60 text-sm mt-1">{currentCategory.name} Review</p>
                    )}
                </div>
            </header>

            {/* Progress bar */}
            <div className="max-w-lg mx-auto px-4 -mt-2 mb-4 relative z-20">
                <div className="bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 px-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: progress === 100 ? '#22c55e' : theme.accentColor,
                                }}
                            />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                            {progress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Welcome message */}
            <div className="max-w-lg mx-auto px-4 pb-8">
                {theme.welcomeMessage && (
                    <p className="text-gray-500 text-center text-sm mb-6">{theme.welcomeMessage}</p>
                )}

                {/* Rating Questions */}
                {ratingQuestions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 fill-current" style={{ color: theme.accentColor }} />
                            Rate Your Experience
                        </h2>

                        {ratingQuestions.map((q, i) => (
                            <QuestionCard
                                key={q._id}
                                question={q}
                                value={answers[q._id]}
                                onRatingChange={(val) => setAnswer(q._id, val)}
                                accentColor={theme.accentColor}
                                primaryColor={theme.primaryColor}
                                index={i}
                            />
                        ))}
                    </div>
                )}

                {/* Yes/No Questions */}
                {yesNoQuestions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Quick Questions
                        </h2>

                        {yesNoQuestions.map((q, i) => (
                            <QuestionCard
                                key={q._id}
                                question={q}
                                value={answers[q._id]}
                                specifyText={specifyTexts[q._id] || ""}
                                onBooleanChange={(val) => setAnswer(q._id, val)}
                                onSpecifyChange={(text) =>
                                    setSpecifyTexts(prev => ({ ...prev, [q._id]: text }))
                                }
                                accentColor={theme.accentColor}
                                primaryColor={theme.primaryColor}
                                index={ratingQuestions.length + i}
                            />
                        ))}
                    </div>
                )}

                {/* Continue Button */}
                <button
                    onClick={() => setPage("info")}
                    disabled={!allQuestionsAnswered}
                    className={clsx(
                        "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300",
                        allQuestionsAnswered
                            ? "text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                    style={allQuestionsAnswered ? {
                        backgroundColor: theme.primaryColor,
                        boxShadow: `0 8px 24px ${theme.primaryColor}35`,
                    } : undefined}
                >
                    {allQuestionsAnswered ? "Continue →" : `${progress}% Complete`}
                </button>

                {!allQuestionsAnswered && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Please rate all questions to continue
                    </p>
                )}

                {/* Branding footer */}
                <div className="text-center mt-8 pb-4">
                    <p className="text-xs text-gray-300">
                        Powered by <span className="font-semibold text-gray-400">Kalalak Insight</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StarRatingReviewPage;
