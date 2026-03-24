/**
 * PostServiceFeedback — Guest rates completed service request
 *
 * Triggered after a service request is marked "Completed".
 * URL: /:hotelCode/service-feedback/:requestId
 *
 * Flow:
 *   → Star rating (1-5)
 *   → If ≤ 3: "Thank you. Our team will resolve this immediately."
 *   → If ≥ 4: "Thank you!" + redirect to Google Review
 *
 * Responsive: phone-first, scales to desktop.
 * Time: O(1), Space: O(1)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceRequestStore } from '../../stores/serviceRequestStore';
import {
    Star, CheckCircle2, Loader2, AlertTriangle,
    ExternalLink, ArrowLeft, Hotel
} from 'lucide-react';

type FeedbackPhase = 'rating' | 'submitting' | 'success_low' | 'success_high';

const PostServiceFeedback: React.FC = () => {
    const { requestId, hotelCode } = useParams<{ requestId: string; hotelCode: string }>();
    const navigate = useNavigate();
    const { submitFeedback, hotelInfo, fetchHotelInfo } = useServiceRequestStore();

    const [phase, setPhase] = useState<FeedbackPhase>('rating');
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');
    const [googleReviewLink, setGoogleReviewLink] = useState<string | undefined>();
    const [error, setError] = useState('');

    useEffect(() => {
        if (hotelCode && !hotelInfo) {
            fetchHotelInfo(hotelCode);
        }
    }, [hotelCode, hotelInfo, fetchHotelInfo]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        setError('');
        setPhase('submitting');

        const result = await submitFeedback(requestId || '', rating, comment.trim() || undefined);

        if (result) {
            setGoogleReviewLink(result.googleReviewLink);
            setPhase(rating <= 3 ? 'success_low' : 'success_high');
        } else {
            setError('Something went wrong. Please try again.');
            setPhase('rating');
        }
    };

    const handleBack = () => {
        const path = hotelCode ? `/${hotelCode}` : '/';
        navigate(path);
    };

    // ── Submitting Screen ──
    if (phase === 'submitting') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <Loader2 style={{ width: 48, height: 48, color: '#1B4D3E', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <p style={{ ...styles.subtitle, marginTop: 16 }}>Submitting your feedback...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ── Success: Low Rating ──
    if (phase === 'success_low') {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.card, animation: 'fadeInUp 0.5s ease-out' }}>
                    <div style={styles.alertIconWrap}>
                        <AlertTriangle style={{ width: 48, height: 48, color: '#f59e0b' }} />
                    </div>
                    <h2 style={styles.title}>Thank You for Your Feedback</h2>
                    <p style={styles.message}>
                        Our team will resolve this immediately. We sincerely apologize for the inconvenience.
                    </p>
                    <button onClick={handleBack} style={styles.secondaryBtn}>
                        Back to Home
                    </button>
                    <p style={styles.footer}>Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong></p>
                </div>
                <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
        );
    }

    // ── Success: High Rating → Google Review ──
    if (phase === 'success_high') {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.card, animation: 'fadeInUp 0.5s ease-out' }}>
                    <div style={styles.successIconWrap}>
                        <CheckCircle2 style={{ width: 48, height: 48, color: '#22c55e' }} />
                    </div>
                    <h2 style={styles.title}>Thank You!</h2>
                    <p style={styles.message}>
                        We're glad you enjoyed our service. Would you mind sharing your experience publicly?
                    </p>
                    {googleReviewLink ? (
                        <a
                            href={googleReviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.googleBtn}
                        >
                            <ExternalLink style={{ width: 18, height: 18 }} />
                            Leave a Google Review
                        </a>
                    ) : (
                        <p style={{ ...styles.subtitle, fontSize: 13, marginTop: 8 }}>
                            Your feedback has been recorded. Thank you!
                        </p>
                    )}
                    <button onClick={handleBack} style={{ ...styles.secondaryBtn, marginTop: 16 }}>
                        Back to Home
                    </button>
                    <p style={styles.footer}>Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong></p>
                </div>
                <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
        );
    }

    // ── Rating Form ──
    return (
        <div style={styles.container}>
            <div style={{ ...styles.card, animation: 'fadeInUp 0.5s ease-out' }}>
                {/* Header */}
                <div style={styles.headerRow}>
                    <button onClick={handleBack} style={styles.backBtn}>
                        <ArrowLeft style={{ width: 18, height: 18 }} />
                    </button>
                    <div style={styles.hotelBadge}>
                        <Hotel style={{ width: 16, height: 16, color: '#1B4D3E' }} />
                        <span style={{ fontSize: 13, color: '#1B4D3E', fontWeight: 600 }}>
                            {hotelInfo?.name || 'Hotel'}
                        </span>
                    </div>
                </div>

                <h2 style={styles.title}>How was our service?</h2>
                <p style={styles.subtitle}>Your feedback helps us improve</p>

                {/* Star Rating */}
                <div style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            style={styles.starBtn}
                        >
                            <Star
                                style={{
                                    width: 44,
                                    height: 44,
                                    color: star <= (hoveredStar || rating) ? '#f59e0b' : '#e2e8f0',
                                    fill: star <= (hoveredStar || rating) ? '#f59e0b' : 'none',
                                    transition: 'all 0.15s ease',
                                    transform: star <= (hoveredStar || rating) ? 'scale(1.1)' : 'scale(1)',
                                }}
                            />
                        </button>
                    ))}
                </div>

                {/* Rating label */}
                {rating > 0 && (
                    <p style={styles.ratingLabel}>
                        {rating <= 2 ? '😔 We can do better' :
                         rating === 3 ? '😐 Average' :
                         rating === 4 ? '😊 Good' : '🌟 Excellent!'}
                    </p>
                )}

                {/* Comment */}
                <div style={styles.commentWrap}>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us more (optional)..."
                        style={styles.textarea}
                        rows={3}
                        maxLength={500}
                    />
                </div>

                {/* Error */}
                {error && <p style={styles.errorText}>{error}</p>}

                {/* Submit */}
                <button onClick={handleSubmit} style={styles.submitBtn}>
                    Submit Feedback
                </button>

                <p style={styles.footer}>Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong></p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #fdf5ec 50%, #f0f7f4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        textAlign: 'center',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
    },
    backBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
    },
    hotelBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '10px',
        background: 'rgba(27,77,62,0.06)',
    },
    title: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
        letterSpacing: '-0.01em',
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748b',
        margin: '0 0 24px',
    },
    message: {
        fontSize: '15px',
        color: '#64748b',
        margin: '0 0 28px',
        lineHeight: 1.6,
    },
    starsContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    starBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '8px',
        transition: 'background 0.15s',
    },
    ratingLabel: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#475569',
        margin: '0 0 20px',
    },
    commentWrap: {
        marginBottom: '20px',
    },
    textarea: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        background: '#fafafa',
        fontSize: '15px',
        color: '#0f172a',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '70px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    errorText: {
        color: '#ef4444',
        fontSize: '13px',
        margin: '0 0 12px',
        fontWeight: '500',
    },
    submitBtn: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #1B4D3E 0%, #2d6a4f 100%)',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(27,77,62,0.25)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
    },
    googleBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 28px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #4285f4 0%, #3367d6 100%)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        boxShadow: '0 6px 20px rgba(66,133,244,0.3)',
        transition: 'all 0.3s ease',
    },
    secondaryBtn: {
        padding: '12px 28px',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        background: '#fff',
        color: '#475569',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    alertIconWrap: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(245,158,11,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
    },
    successIconWrap: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
    },
    footer: {
        fontSize: '13px',
        color: '#94a3b8',
        marginTop: '24px',
    },
};

export default PostServiceFeedback;
