/**
 * GuestLandingPage — QR Code Entry Point
 *
 * "How can we assist you today?"
 * Two main buttons: Request Service | Share Feedback
 *
 * Responsive: phone-first design, scales to tablet/desktop.
 * Time: O(1), Space: O(1)
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceRequestStore } from '../../stores/serviceRequestStore';
import { Bell, MessageSquareHeart, ChevronRight, Loader2, Hotel } from 'lucide-react';

const GuestLandingPage: React.FC = () => {
    const { hotelCode, orgSlug } = useParams<{ hotelCode: string; orgSlug?: string }>();
    const navigate = useNavigate();
    const { hotelInfo, fetchHotelInfo } = useServiceRequestStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (hotelCode) {
            fetchHotelInfo(hotelCode, orgSlug).finally(() => setIsLoading(false));
        }
    }, [hotelCode, orgSlug, fetchHotelInfo]);

    const handleRequestService = () => {
        const path = orgSlug
            ? `/${orgSlug}/${hotelCode}/service-request`
            : `/${hotelCode}/service-request`;
        navigate(path);
    };

    const handleShareFeedback = () => {
        // Navigate to existing review categories page
        const path = orgSlug
            ? `/${orgSlug}/${hotelCode}/feedback`
            : `/${hotelCode}/feedback`;
        navigate(path);
    };

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <Loader2 style={{ width: 48, height: 48, color: '#1B4D3E', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Background decoration */}
            <div style={styles.bgDecoration1} />
            <div style={styles.bgDecoration2} />

            <div style={styles.content}>
                {/* Hotel Branding */}
                <div style={styles.brandSection}>
                    <div style={styles.logoContainer}>
                        <Hotel style={{ width: 32, height: 32, color: '#1B4D3E' }} />
                    </div>
                    <h2 style={styles.hotelName}>
                        {hotelInfo?.name || 'Welcome'}
                    </h2>
                </div>

                {/* Main Title */}
                <div style={styles.titleSection}>
                    <h1 style={styles.title}>Kalalak Guest Experience</h1>
                    <p style={styles.subtitle}>How can we assist you today?</p>
                </div>

                {/* Action Buttons */}
                <div style={styles.buttonsContainer}>
                    {/* Request Service Button */}
                    <button
                        onClick={handleRequestService}
                        style={styles.serviceBtn}
                        id="request-service-btn"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(27, 77, 62, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(27, 77, 62, 0.25)';
                        }}
                    >
                        <div style={styles.btnIconWrap}>
                            <Bell style={{ width: 28, height: 28, color: '#fff' }} />
                        </div>
                        <div style={styles.btnTextWrap}>
                            <span style={styles.btnTitle}>Request a Service</span>
                            <span style={styles.btnDesc}>Towel, Water, Cleaning, AC & more</span>
                        </div>
                        <ChevronRight style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                    </button>

                    {/* Share Feedback Button */}
                    <button
                        onClick={handleShareFeedback}
                        style={styles.feedbackBtn}
                        id="share-feedback-btn"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(228, 181, 128, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(228, 181, 128, 0.25)';
                        }}
                    >
                        <div style={styles.btnIconWrapGold}>
                            <MessageSquareHeart style={{ width: 28, height: 28, color: '#fff' }} />
                        </div>
                        <div style={styles.btnTextWrap}>
                            <span style={styles.btnTitleDark}>Share Your Feedback</span>
                            <span style={styles.btnDescDark}>Rate your experience & help us improve</span>
                        </div>
                        <ChevronRight style={{ width: 24, height: 24, color: 'rgba(27,77,62,0.4)', flexShrink: 0 }} />
                    </button>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p style={styles.footerText}>Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong></p>
                </div>
            </div>

            {/* Inline keyframes for spin animation */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// ── Inline Styles (responsive-first) ──

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #fdf5ec 50%, #f0f7f4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #fdf5ec 100%)',
    },
    bgDecoration1: {
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,77,62,0.08) 0%, transparent 70%)',
    },
    bgDecoration2: {
        position: 'absolute',
        bottom: '-80px',
        left: '-80px',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(228,181,128,0.1) 0%, transparent 70%)',
    },
    content: {
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.6s ease-out',
    },
    brandSection: {
        textAlign: 'center',
        marginBottom: '24px',
    },
    logoContainer: {
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(27,77,62,0.1) 0%, rgba(27,77,62,0.05) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        border: '1px solid rgba(27,77,62,0.1)',
    },
    hotelName: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1B4D3E',
        margin: 0,
        letterSpacing: '-0.01em',
    },
    titleSection: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
    },
    subtitle: {
        fontSize: '16px',
        color: '#64748b',
        margin: 0,
        fontWeight: '400',
    },
    buttonsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '40px',
    },
    serviceBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '20px',
        border: 'none',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #1B4D3E 0%, #2d6a4f 100%)',
        color: '#fff',
        textAlign: 'left',
        boxShadow: '0 8px 32px rgba(27, 77, 62, 0.25)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
    },
    feedbackBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '20px',
        border: '1px solid rgba(228, 181, 128, 0.3)',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #fffbf5 0%, #fff8ef 100%)',
        color: '#0f172a',
        textAlign: 'left',
        boxShadow: '0 8px 32px rgba(228, 181, 128, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
    },
    btnIconWrap: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    btnIconWrapGold: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #E4B580 0%, #d4a574 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    btnTextWrap: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    btnTitle: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#fff',
    },
    btnTitleDark: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#0f172a',
    },
    btnDesc: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '400',
    },
    btnDescDark: {
        fontSize: '13px',
        color: '#64748b',
        fontWeight: '400',
    },
    footer: {
        textAlign: 'center',
    },
    footerText: {
        fontSize: '13px',
        color: '#94a3b8',
        margin: 0,
    },
};

export default GuestLandingPage;
