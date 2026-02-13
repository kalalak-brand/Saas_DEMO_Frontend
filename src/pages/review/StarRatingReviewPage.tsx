// src/pages/review/StarRatingReviewPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Send, ArrowLeft, Loader2 } from "lucide-react";
import { useReviewStore, ReviewPayload } from "../../stores/reviewStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useCategoryStore } from "../../stores/categoryStore";
import { PlaceholderLogo } from "../../components/common/PlaceholderLogo";
import toast from "react-hot-toast";
import clsx from "clsx";

/**
 * Interactive Star Rating Component
 */
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

    // Responsive size classes - smaller on mobile for 10-star scale
    const getSizeClasses = () => {
        if (max > 5) {
            // For 10-star scale, use smaller stars and wrap
            return {
                sm: "w-5 h-5",
                md: "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8",
                lg: "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10",
            };
        }
        return {
            sm: "w-6 h-6",
            md: "w-8 h-8 md:w-10 md:h-10",
            lg: "w-10 h-10 md:w-12 md:h-12",
        };
    };

    const sizeClasses = getSizeClasses();

    return (
        <div className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1;
                const isFilled = (hoverValue ?? value) >= starValue;

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        className={clsx(
                            "transition-all duration-150",
                            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
                        )}
                        style={{ color: isFilled ? accentColor : '#d1d5db' }}
                        onMouseEnter={() => !disabled && setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(null)}
                        onClick={() => !disabled && onChange(starValue)}
                    >
                        <Star
                            className={clsx(sizeClasses[size], isFilled && "fill-current")}
                        />
                    </button>
                );
            })}
        </div>
    );
};

/**
 * Question Card Component
 */
interface QuestionCardProps {
    question: { _id: string; text: string; questionType: string };
    value: number | boolean | null;
    onRatingChange?: (value: number) => void;
    onBooleanChange?: (value: boolean) => void;

    accentColor?: string;
    primaryColor?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    value,
    onRatingChange,
    onBooleanChange,

    accentColor = "#c9a962",
    primaryColor = "#1e3a5f",
}) => {
    const isRating = question.questionType === "rating";

    return (
        <div
            className="bg-white rounded-xl shadow-md p-6 mb-4 border hover:shadow-lg transition-shadow"
            style={{ borderColor: `${primaryColor}20` }}
        >
            <h3 className="text-lg font-medium text-gray-800 mb-4">{question.text}</h3>

            {isRating ? (
                <div className="flex flex-col items-center gap-3">
                    <StarRating
                        value={typeof value === "number" ? value : 0}
                        onChange={onRatingChange ?? (() => { })}
                        max={5}
                        size="lg"
                        accentColor={accentColor}
                    />
                    <p className="text-sm text-gray-500">
                        {value ? `${value} / 5` : "Tap a star to rate"}
                    </p>
                </div>
            ) : (
                <div className="flex gap-4 justify-center">
                    <button
                        type="button"
                        onClick={() => onBooleanChange?.(true)}
                        className={clsx(
                            "px-6 py-3 rounded-lg font-medium transition-all",
                            value === true
                                ? "bg-green-500 text-white shadow-lg scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-green-100"
                        )}
                    >
                        ✓ Yes
                    </button>
                    <button
                        type="button"
                        onClick={() => onBooleanChange?.(false)}
                        className={clsx(
                            "px-6 py-3 rounded-lg font-medium transition-all",
                            value === false
                                ? "bg-red-500 text-white shadow-lg scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-red-100"
                        )}
                    >
                        ✗ No
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Star Rating Review Page
 * Modern, mobile-first design with animated star ratings
 */
const StarRatingReviewPage: React.FC = () => {
    const { category, hotelCode } = useParams<{ category: string; hotelCode: string }>();
    const navigate = useNavigate();
    const [page, setPage] = useState<"review" | "info" | "thankyou">("review");

    const { theme } = useSettingsStore();
    const { getCategoryBySlug } = useCategoryStore();

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestRoom, setGuestRoom] = useState("");
    const [description, setDescription] = useState("");

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
            fetchQuestions(category, hotelCode);
        }
    }, [category, hotelCode, fetchQuestions, resetReview]);

    const { ratingQuestions, yesNoQuestions } = useMemo(() => ({
        ratingQuestions: questions.filter(q => q.questionType === "rating"),
        yesNoQuestions: questions.filter(q => q.questionType === "yes_no"),
    }), [questions]);

    const allQuestionsAnswered = useMemo(() => {
        return ratingQuestions.every(q => answers[q._id] !== null && answers[q._id] !== undefined);
    }, [ratingQuestions, answers]);

    const handleSubmit = async () => {
        if (!category) return;

        if (!guestName.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (!guestPhone.trim()) {
            toast.error("Please enter your phone number");
            return;
        }

        const answersPayload = Object.keys(answers)
            .filter(qId => answers[qId] !== null && answers[qId] !== undefined)
            .map(qId => {
                const question = questions.find(q => q._id === qId);
                const answer = answers[qId];

                if (question?.questionType === "rating") {
                    return { question: qId, rating: answer as number };
                }
                return { question: qId, answerBoolean: answer as boolean };
            });

        const payload: ReviewPayload = {
            category,
            answers: answersPayload as ReviewPayload["answers"],
            description: description.trim(),
            guestInfo: {
                name: guestName.trim(),
                phone: guestPhone.trim(),
                roomNumber: guestRoom.trim() || "N/A",
            },
            hotelCode: hotelCode,
        };

        const success = await submitReview(payload);
        if (success) {
            toast.success("Thank you for your feedback!");
            setPage("thankyou");
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    // Thank you page
    if (page === "thankyou") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Star className="w-10 h-10 text-green-500 fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h1>
                    <p className="text-gray-600 mb-6">{theme.thankYouMessage}</p>
                    <button
                        onClick={() => navigate("/review/dashboard")}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Submit Another Review
                    </button>
                </div>
            </div>
        );
    }

    // Guest info page
    if (page === "info") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={() => setPage("review")}
                        className="flex items-center gap-2 text-gray-600 mb-6 hover:text-primary"
                    >
                        <ArrowLeft size={20} />
                        Back to Questions
                    </button>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    value={guestPhone}
                                    onChange={e => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="10-digit phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={guestRoom}
                                    onChange={e => setGuestRoom(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 101"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Comments
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Any additional feedback..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={clsx(
                                "w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-white transition-all",
                                isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-primary hover:shadow-lg hover:scale-[1.02]"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main review page
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
            {/* Header */}
            <header className="bg-primary text-white p-6">
                <div className="max-w-lg mx-auto text-center">
                    <PlaceholderLogo size="md" showText={false} />
                    <h1 className="text-2xl font-semibold mt-4">
                        {hotelInfo?.name || "Guest Feedback"}
                    </h1>
                    {currentCategory && (
                        <p className="text-white/70 mt-1">{currentCategory.name} Review</p>
                    )}
                </div>
            </header>

            {/* Welcome message */}
            <div className="max-w-lg mx-auto px-4 py-6">
                <p className="text-gray-600 text-center mb-8">{theme.welcomeMessage}</p>

                {/* Rating Questions */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 fill-current" style={{ color: theme.accentColor }} />
                        Rate Your Experience
                    </h2>

                    {ratingQuestions.map(q => (
                        <QuestionCard
                            key={q._id}
                            question={q}
                            value={answers[q._id]}
                            onRatingChange={(val) => setAnswer(q._id, val)}

                            accentColor={theme.accentColor}
                            primaryColor={theme.primaryColor}
                        />
                    ))}
                </div>

                {/* Yes/No Questions */}
                {yesNoQuestions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Quick Questions
                        </h2>

                        {yesNoQuestions.map(q => (
                            <QuestionCard
                                key={q._id}
                                question={q}
                                value={answers[q._id]}
                                onBooleanChange={(val) => setAnswer(q._id, val)}

                                accentColor={theme.accentColor}
                                primaryColor={theme.primaryColor}
                            />
                        ))}
                    </div>
                )}

                {/* Continue Button */}
                <button
                    onClick={() => setPage("info")}
                    disabled={!allQuestionsAnswered}
                    className={clsx(
                        "w-full py-4 rounded-xl font-semibold text-lg transition-all",
                        allQuestionsAnswered
                            ? "bg-primary text-white hover:shadow-lg hover:scale-[1.02]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                >
                    Continue
                </button>

                {!allQuestionsAnswered && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                        Please answer all rating questions to continue
                    </p>
                )}
            </div>
        </div>
    );
};

export default StarRatingReviewPage;
