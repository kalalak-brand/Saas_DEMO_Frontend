// src/pages/public/PublicReviewPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useTokenStore } from "../../stores/tokenStore";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ReviewPayload, useReviewStore } from "../../stores/reviewStore";
import { Send, Loader2, ChevronLeft, Star, CheckCircle } from "lucide-react";
import clsx from "clsx";

// Hotel logo - using Kalalak as default
import hotelLogo from "../../assets/logo/Kalalak.png";

// --- Theme colors (can be extended to use settingsStore for public pages) ---
const THEME = {
  primaryColor: "#1e3a5f",
  accentColor: "#c9a962",
};

// --- Adaptive Rating Component ---
interface AdaptiveRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  max: 5 | 10;
  accentColor?: string;
}

const AdaptiveRating: React.FC<AdaptiveRatingProps> = ({
  value,
  onChange,
  max,
  accentColor = THEME.accentColor
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // For 1-5: Use star rating
  if (max === 5) {
    return (
      <div className="flex gap-2 justify-center">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const isFilled = (hoverValue ?? value ?? 0) >= starValue;
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(null)}
              className="transition-transform hover:scale-110"
              style={{ color: isFilled ? accentColor : '#d1d5db' }}
            >
              <Star className={clsx("w-8 h-8 md:w-10 md:h-10", isFilled && "fill-current")} />
            </button>
          );
        })}
      </div>
    );
  }

  // For 1-10: Use button grid (2x5 on mobile, 1x10 on tablet+)
  return (
    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
      {Array.from({ length: max }, (_, i) => {
        const ratingValue = i + 1;
        const isSelected = value === ratingValue;
        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(ratingValue)}
            className={clsx(
              "w-10 h-10 md:w-12 md:h-12 rounded-lg font-semibold transition-all",
              isSelected
                ? "text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            style={isSelected ? { backgroundColor: accentColor } : {}}
          >
            {ratingValue}
          </button>
        );
      })}
    </div>
  );
};

// --- Question Card Component ---
interface QuestionCardProps {
  question: { _id: string; text: string; questionType: string };
  answer: number | boolean | null | undefined;
  yesNoText?: string;
  onRatingChange?: (value: number) => void;
  onBooleanChange?: (value: boolean) => void;
  onTextChange?: (value: string) => void;
  ratingScale: 5 | 10;
  isReferralQuestion?: boolean;
  referralOptions?: string[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  yesNoText,
  onRatingChange,
  onBooleanChange,
  onTextChange,
  ratingScale,
  isReferralQuestion = false,
  referralOptions = [],
}) => {
  const isRating = question.questionType === "rating";

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-3 border-l-4"
      style={{ borderColor: THEME.primaryColor }}
    >
      <h3 className="text-sm md:text-base font-medium text-gray-800 mb-4">
        {question.text}
      </h3>

      {isRating ? (
        <AdaptiveRating
          value={typeof answer === "number" ? answer : null}
          onChange={onRatingChange ?? (() => { })}
          max={ratingScale}
          accentColor={THEME.accentColor}
        />
      ) : isReferralQuestion ? (
        // Referral question with multiple choice
        <div className="flex flex-wrap gap-2 justify-center">
          {referralOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onBooleanChange?.(true);
                onTextChange?.(option);
              }}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                yesNoText === option
                  ? "text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              style={yesNoText === option ? { backgroundColor: THEME.accentColor } : {}}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        // Standard Yes/No
        <div className="space-y-3">
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => onBooleanChange?.(true)}
              className={clsx(
                "flex-1 max-w-[120px] py-3 rounded-lg font-medium transition-all",
                answer === true
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-green-50"
              )}
            >
              ✓ Yes
            </button>
            <button
              type="button"
              onClick={() => onBooleanChange?.(false)}
              className={clsx(
                "flex-1 max-w-[120px] py-3 rounded-lg font-medium transition-all",
                answer === false
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-red-50"
              )}
            >
              ✗ No
            </button>
          </div>
          {answer === true && onTextChange && (
            <input
              type="text"
              value={yesNoText || ""}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Please specify (optional)..."
              className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Public Review Page Component ---
const PublicReviewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<"review" | "info" | "thankyou">("review");
  const ratingScale: 5 | 10 = 10; // Public pages use 1-10 scale

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestRoom, setGuestRoom] = useState("");
  const [description, setDescription] = useState("");

  const {
    publicCategory,
    publicCategoryInfo, // NEW: Get full category object
    publicHotelId,
    isPublicLoading,
    publicError,
    validateToken,
    submitPublicReview,
    publicFetchQuestions, // Use public endpoint - no auth required
  } = useTokenStore();

  const {
    questions,
    answers,
    yesNoAnswerText,
    isSubmitting,
    isLoading: isQuestionsLoading,
    setAnswer,
    setYesNoAnswerText,
    resetReview,
  } = useReviewStore();

  // Determine logo - use single hotel logo
  const logoToShow = hotelLogo;

  // Hotel display name
  const hotelDisplayName = useMemo(() => {
    const hotelName = publicHotelId?.name?.toLowerCase();
    return hotelName?.includes("wayanad") ? "Wayanad" : "Calicut";
  }, [publicHotelId]);

  // Welcome text - use category name for dynamic branding
  const welcomeText = useMemo(() => {
    const categoryName = publicCategoryInfo?.name?.toLowerCase() || '';
    if (categoryName.includes('coffee') || categoryName.includes('cafe')) {
      return `Thank you for experiencing ${publicCategoryInfo?.name} ${hotelDisplayName}. We would greatly appreciate you taking the time to complete this survey.`;
    }
    return `Thank you for choosing Oshin Hotels and Resorts ${hotelDisplayName}. We would greatly appreciate you taking the time to complete this survey.`;
  }, [publicCategoryInfo, hotelDisplayName]);

  // Thank you text - use category name for dynamic branding
  const thankyouNote = useMemo(() => {
    const categoryName = publicCategoryInfo?.name?.toLowerCase() || '';
    if (categoryName.includes('coffee') || categoryName.includes('cafe')) {
      return `Looking forward to welcoming you back for yet another experience at ${publicCategoryInfo?.name} ${hotelDisplayName}.`;
    }
    return `Looking forward to welcoming you back for yet another remarkable stay with Oshin Hotels and Resort ${hotelDisplayName}.`;
  }, [publicCategoryInfo, hotelDisplayName]);

  // Validate token on mount
  useEffect(() => {
    resetReview();
    if (token) {
      validateToken(token);
    } else {
      navigate("/login");
    }
  }, [token, validateToken, navigate, resetReview]);

  // Fetch questions after token validation (public endpoint - no auth)
  useEffect(() => {
    if (publicCategory) {
      publicFetchQuestions(publicCategory);
    }
  }, [publicCategory, publicFetchQuestions]);

  // Memoize questions
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
    if (!publicCategory || !token) return;

    if (!guestName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!guestPhone.trim() || guestPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
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
        return {
          question: qId,
          answerBoolean: answer as boolean,
          answerText: answer === true ? yesNoAnswerText[qId] : undefined
        };
      });

    const getGuestInfo = () => {
      if (publicCategory === "room") {
        return {
          name: guestName.trim(),
          phone: guestPhone.trim(),
          roomNumber: guestRoom.trim(),
        };
      }
      return {
        name: guestName.trim(),
        phone: guestPhone.trim(),
      };
    };

    const payload: ReviewPayload = {
      category: publicCategory,
      answers: answersPayload as ReviewPayload["answers"],
      description: description.trim(),
      guestInfo: getGuestInfo(),
    };

    const success = await submitPublicReview(token, payload);
    if (success) {
      toast.success("Thank you for your feedback!");
      setPage("thankyou");
      resetReview();
    }
  };

  // Loading state
  if (isPublicLoading || isQuestionsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${THEME.primaryColor}10, ${THEME.accentColor}10)` }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: THEME.primaryColor }} />
          <p className="mt-4 text-gray-600">Loading Review Form...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (publicError && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-red-500">✕</span>
          </div>
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Link Invalid</h2>
          <p className="text-gray-700">{publicError}</p>
        </div>
      </div>
    );
  }

  // Thank you page
  if (page === "thankyou") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${THEME.primaryColor}10, ${THEME.accentColor}20)` }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: THEME.primaryColor }}>
            Thank You!
          </h1>
          <p className="text-gray-600">{thankyouNote}</p>
        </div>
      </div>
    );
  }

  // Guest info page
  if (page === "info") {
    return (
      <div
        className="min-h-screen p-4 md:p-6"
        style={{ background: `linear-gradient(135deg, ${THEME.primaryColor}08, ${THEME.accentColor}08)` }}
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
            <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: THEME.primaryColor }}>
              Guest Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp No *</label>
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
              {publicCategoryInfo?.guestInfoFields?.roomNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Comments
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent resize-none"
                  placeholder="Any memorable experiences or exceptional associates..."
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
              style={!isSubmitting ? { backgroundColor: THEME.primaryColor } : {}}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
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
      style={{ background: `linear-gradient(135deg, ${THEME.primaryColor}08, ${THEME.accentColor}08)` }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 p-4 md:p-6 text-white text-center"
        style={{ backgroundColor: THEME.primaryColor }}
      >
        <img src={logoToShow} alt="Logo" className="h-16 md:h-20 mx-auto mb-2" />
        <h1 className="text-xl md:text-2xl font-light tracking-wide">
          {publicCategory === "cfc" ? "Coffee Klatch" : "Oshin Hotels & Resorts"}
        </h1>
      </header>

      {/* Content */}
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="bg-white rounded-xl p-4 md:p-8 mb-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Dear Valued Guest,</h2>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">{welcomeText}</p>
        </div>

        {/* Rating indicator */}
        <div className="text-center mb-4">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${THEME.accentColor}20`, color: THEME.primaryColor }}
          >
            Rate from 1 (Poor) to {ratingScale} (Outstanding)
          </span>
        </div>

        {/* Rating Questions */}
        {ratingQuestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.primaryColor }}>
              <Star className="w-5 h-5" style={{ color: THEME.accentColor, fill: THEME.accentColor }} />
              Rate Your Experience
            </h2>
            {ratingQuestions.map(q => (
              <QuestionCard
                key={q._id}
                question={q}
                answer={answers[q._id]}
                onRatingChange={(val) => setAnswer(q._id, val)}
                ratingScale={ratingScale}
              />
            ))}
          </div>
        )}

        {/* Yes/No Questions */}
        {yesNoQuestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base md:text-lg font-semibold mb-4" style={{ color: THEME.primaryColor }}>
              Additional Questions
            </h2>
            {yesNoQuestions.map(q => {
              const isReferralQuestion = publicCategory === 'cfc' &&
                q.text.toLowerCase().includes("how did you hear about us");

              return (
                <QuestionCard
                  key={q._id}
                  question={q}
                  answer={answers[q._id]}
                  yesNoText={yesNoAnswerText[q._id]}
                  onBooleanChange={(val) => setAnswer(q._id, val)}
                  onTextChange={(val) => setYesNoAnswerText(q._id, val)}
                  ratingScale={ratingScale}
                  isReferralQuestion={isReferralQuestion}
                  referralOptions={['Friends', 'Facebook', 'Instagram', 'Google', 'Other']}
                />
              );
            })}
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
          style={allRatingsAnswered ? { backgroundColor: THEME.primaryColor } : {}}
        >
          Continue
        </button>

        {!allRatingsAnswered && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Please rate all questions to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicReviewPage;