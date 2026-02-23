// src/pages/review/ReviewPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useReviewStore, ReviewPayload } from "../../stores/reviewStore";
import { useParams } from "react-router-dom";
import { useSettingsStore } from "../../stores/settingsStore";
import { PlaceholderLogo } from "../../components/common/PlaceholderLogo";
import { QuestionCard } from "../../components/ui/QuestionCard";
import toast from 'react-hot-toast';
import { Send, Loader2, ChevronLeft, Star, ExternalLink } from "lucide-react";
import clsx from "clsx";

// --- Main Review Page Component ---
const ReviewPage: React.FC = () => {
    const { category, hotelCode, orgSlug } = useParams<{ category: string; hotelCode: string; orgSlug?: string }>();
    const [page, setPage] = useState<"review" | "info" | "thankyou">("review");

    const { theme } = useSettingsStore();

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestRoom, setGuestRoom] = useState("");
    const [description, setDescription] = useState("");

    const {
        questions,
        answers,
        yesNoAnswerText,
        isSubmitting,
        isLoading,
        fetchQuestions,
        setAnswer,
        setYesNoAnswerText,
        submitReview,
        resetReview,
        categoryInfo,
        hotelInfo,
    } = useReviewStore();

    // Use category info from reviewStore (fetched from public API)
    const currentCategory = categoryInfo;

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

    // Questions are optional - guests can continue anytime
    const allRatingsAnswered = true; // Always allow continue

    const handlePhoneChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, "").slice(0, 10);
        setGuestPhone(numericValue);
    };

    const handleSubmit = async () => {
        if (!category) return;

        // No mandatory guest info fields — all optional

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
                    answerText: answer === true ? yesNoAnswerText[qId] : undefined
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



    // Pre-build Map for O(1) question-type lookups instead of O(n) .find() per entry
    // Time: O(n) build, Space: O(n) where n = number of questions
    const questionTypeMap = useMemo(
        () => new Map(questions.map(q => [q._id, q.questionType])),
        [questions]
    );

    // Compute average rating from submitted answers
    // Time: O(m) where m = number of answers, Space: O(1) — using pre-built Map for O(1) lookups
    const averageRating = useMemo(() => {
        let sum = 0;
        let count = 0;
        for (const [qId, val] of Object.entries(answers)) {
            if (typeof val === 'number' && questionTypeMap.get(qId) === 'rating') {
                sum += val;
                count++;
            }
        }
        return count === 0 ? 0 : sum / count;
    }, [answers, questionTypeMap]);

    const showGoogleReview = averageRating >= 4 && !!hotelInfo?.googleReviewLink;

    // Loading state
    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.accentColor}10)` }}
            >
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: theme.primaryColor }} />
                    <p className="mt-4 text-gray-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    // Thank you page
    if (page === "thankyou") {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.accentColor}20)` }}
            >
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${theme.accentColor}20` }}
                    >
                        <Star className="w-10 h-10" style={{ color: theme.accentColor, fill: theme.accentColor }} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: theme.primaryColor }}>
                        Thank You!
                    </h1>
                    <p className="text-gray-600 mb-6">{theme.thankYouMessage}</p>

                    {/* Google Review Prompt — shown for high ratings when link is configured */}
                    {showGoogleReview && (
                        <div
                            className="mb-6 p-5 rounded-xl border"
                            style={{
                                borderColor: `${theme.accentColor}40`,
                                background: `linear-gradient(135deg, ${theme.accentColor}08, ${theme.primaryColor}05)`,
                            }}
                        >
                            <p className="text-gray-700 font-medium mb-4">
                                {hotelInfo?.postReviewMessage || "Would you like to share your experience on Google?"}
                            </p>
                            <a
                                href={hotelInfo!.googleReviewLink!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                                style={{ backgroundColor: theme.primaryColor }}
                            >
                                <ExternalLink size={18} />
                                Leave a Google Review
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Guest info page
    if (page === "info") {
        return (
            <div
                className="min-h-screen p-4 md:p-6"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}08, ${theme.accentColor}08)` }}
            >
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => setPage("review")}
                        className="flex items-center gap-2 text-gray-600 mb-6 hover:opacity-80"
                    >
                        <ChevronLeft size={20} />
                        Back to Questions
                    </button>

                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                        <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                            Your Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                                    style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={guestPhone}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                                    placeholder="10-digit phone number"
                                    maxLength={10}
                                />
                            </div>
                            {category?.toLowerCase() === 'room' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                    <input
                                        type="text"
                                        value={guestRoom}
                                        onChange={e => setGuestRoom(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                                        placeholder="e.g., 101"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent resize-none"
                                    placeholder="Any additional feedback..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={clsx(
                                "w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white transition-all",
                                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "hover:shadow-lg"
                            )}
                            style={!isSubmitting ? { backgroundColor: theme.primaryColor } : {}}
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
        <div
            className="min-h-screen"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}08, ${theme.accentColor}08)` }}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-10 p-4 md:p-6 text-white"
                style={{ backgroundColor: theme.primaryColor }}
            >
                <div className="max-w-lg md:max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PlaceholderLogo size="sm" showText={false} />
                        <div>
                            <h1 className="text-lg md:text-xl font-semibold">
                                {hotelInfo?.name || "Guest Feedback"}
                            </h1>
                            {currentCategory && (
                                <p className="text-white/70 text-sm">{currentCategory.name}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
                <p className="text-gray-600 text-center text-sm md:text-base mb-6">
                    {theme.welcomeMessage}
                </p>

                {/* Rating scale indicator */}
                <div className="text-center mb-4">
                    <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${theme.accentColor}20`, color: theme.primaryColor }}
                    >
                        Rating Scale: 1-5
                    </span>
                </div>

                {/* Rating Questions */}
                {ratingQuestions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.primaryColor }}>
                            <Star className="w-5 h-5" style={{ color: theme.accentColor, fill: theme.accentColor }} />
                            Rate Your Experience
                        </h2>
                        {ratingQuestions.map(q => (
                            <QuestionCard
                                key={q._id}
                                question={q}
                                answer={answers[q._id]}
                                onRatingChange={(val) => setAnswer(q._id, val)}

                                primaryColor={theme.primaryColor}
                                accentColor={theme.accentColor}
                            />
                        ))}
                    </div>
                )}

                {/* Yes/No Questions */}
                {yesNoQuestions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-base md:text-lg font-semibold mb-4" style={{ color: theme.primaryColor }}>
                            Quick Questions
                        </h2>
                        {yesNoQuestions.map(q => (
                            <QuestionCard
                                key={q._id}
                                question={q}
                                answer={answers[q._id]}
                                yesNoText={yesNoAnswerText[q._id]}
                                onBooleanChange={(val) => setAnswer(q._id, val)}
                                onTextChange={(val) => setYesNoAnswerText(q._id, val)}

                                primaryColor={theme.primaryColor}
                                accentColor={theme.accentColor}
                            />
                        ))}
                    </div>
                )}

                {/* Continue Button */}
                <button
                    onClick={() => setPage("info")}
                    disabled={!allRatingsAnswered}
                    className={clsx(
                        "w-full py-4 rounded-xl font-semibold text-lg transition-all",
                        allRatingsAnswered
                            ? "text-white hover:shadow-lg"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                    style={allRatingsAnswered ? { backgroundColor: theme.primaryColor } : {}}
                >
                    Continue
                </button>

                {!allRatingsAnswered && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                        Please answer all rating questions to continue
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReviewPage;