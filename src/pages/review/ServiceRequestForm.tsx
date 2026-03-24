/**
 * ServiceRequestForm — Guest-facing service request submission
 *
 * Quick-select service type buttons + room number input
 * Mobile-first, responsive, premium design
 *
 * Time: O(1), Space: O(1)
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceRequestStore } from '../../stores/serviceRequestStore';
import {
    ArrowLeft, CheckCircle2, Loader2, Hotel,
    Send, MessageSquare
} from 'lucide-react';

const ServiceRequestForm: React.FC = () => {
    const { hotelCode, orgSlug, roomNumber: urlRoomNumber } = useParams<{ hotelCode: string; orgSlug?: string; roomNumber?: string }>();
    const isRoomFromQR = Boolean(urlRoomNumber);
    const navigate = useNavigate();
    const {
        requestTypes,
        hotelInfo,
        isLoadingTypes,
        isSubmitting,
        submitSuccess,
        submitResult,
        fetchRequestTypes,
        fetchHotelInfo,
        submitServiceRequest,
        resetSubmitState,
    } = useServiceRequestStore();

    const [selectedType, setSelectedType] = useState<string>('');
    const [roomNumber, setRoomNumber] = useState(urlRoomNumber || '');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [showError, setShowError] = useState('');

    useEffect(() => {
        fetchRequestTypes();
        if (hotelCode && !hotelInfo) {
            fetchHotelInfo(hotelCode, orgSlug);
        }
        return () => resetSubmitState();
    }, [hotelCode, orgSlug, fetchRequestTypes, fetchHotelInfo, hotelInfo, resetSubmitState]);

    const handleSubmit = async () => {
        if (!selectedType) {
            setShowError('Please select a service');
            return;
        }
        if (!roomNumber.trim()) {
            setShowError('Please enter your room number');
            return;
        }
        setShowError('');

        await submitServiceRequest({
            hotelCode: hotelCode || '',
            orgSlug,
            requestType: selectedType,
            roomNumber: roomNumber.trim(),
            guestName: guestName.trim() || undefined,
            guestPhone: guestPhone.trim() || undefined,
            customMessage: selectedType === 'other' ? customMessage.trim() : undefined,
        });
    };

    const handleBack = () => {
        const base = orgSlug ? `/${orgSlug}/${hotelCode}` : `/${hotelCode}`;
        const path = urlRoomNumber ? `${base}/room/${urlRoomNumber}` : base;
        navigate(path);
    };

    // ── Success Screen ──
    if (submitSuccess) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.successIconWrap}>
                        <CheckCircle2 style={{ width: 56, height: 56, color: '#22c55e' }} />
                    </div>
                    <h2 style={styles.successTitle}>Request Sent!</h2>
                    <p style={styles.successMessage}>
                        Our team is on it. Your request has been forwarded to{' '}
                        <strong>{submitResult?.department || 'the team'}</strong>.
                    </p>
                    <div style={styles.successDetail}>
                        <span style={styles.successLabel}>Service</span>
                        <span style={styles.successValue}>{submitResult?.requestLabel}</span>
                    </div>
                    <div style={styles.successDetail}>
                        <span style={styles.successLabel}>Room</span>
                        <span style={styles.successValue}>{roomNumber}</span>
                    </div>
                    <button onClick={handleBack} style={styles.backToHomeBtn}>
                        Back to Home
                    </button>
                    <p style={styles.footerText}>
                        Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong>
                    </p>
                </div>
                <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
        );
    }

    // ── Request Form ──
    return (
        <div style={styles.container}>
            <div style={styles.formCard}>
                {/* Header */}
                <div style={styles.header}>
                    <button onClick={handleBack} style={styles.backBtn}>
                        <ArrowLeft style={{ width: 20, height: 20 }} />
                    </button>
                    <div>
                        <h1 style={styles.formTitle}>Request a Service</h1>
                        <p style={styles.formSubtitle}>{hotelInfo?.name || 'Hotel'}</p>
                    </div>
                    <div style={styles.hotelIconWrap}>
                        <Hotel style={{ width: 20, height: 20, color: '#1B4D3E' }} />
                    </div>
                </div>

                {/* Service Type Selection */}
                <div style={styles.section}>
                    <label style={styles.sectionLabel}>What do you need?</label>
                    {isLoadingTypes ? (
                        <div style={{ textAlign: 'center', padding: '24px' }}>
                            <Loader2 style={{ width: 32, height: 32, color: '#1B4D3E', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        </div>
                    ) : (
                        <div style={styles.typeGrid}>
                            {requestTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => { setSelectedType(type.value); setShowError(''); }}
                                    style={{
                                        ...styles.typeBtn,
                                        ...(selectedType === type.value ? styles.typeBtnSelected : {}),
                                    }}
                                >
                                    <span style={styles.typeIcon}>{type.icon}</span>
                                    <span style={{
                                        ...styles.typeLabel,
                                        color: selectedType === type.value ? '#1B4D3E' : '#475569',
                                    }}>
                                        {type.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom message for "Other" */}
                {selectedType === 'other' && (
                    <div style={styles.section}>
                        <label style={styles.sectionLabel}>Describe your request</label>
                        <div style={styles.inputWrap}>
                            <MessageSquare style={{ width: 18, height: 18, color: '#94a3b8', flexShrink: 0 }} />
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Tell us what you need..."
                                style={styles.textarea}
                                rows={3}
                                maxLength={500}
                            />
                        </div>
                    </div>
                )}

                {/* Guest Details */}
                <div style={styles.section}>
                    <label style={styles.sectionLabel}>Your Details</label>

                    <div style={styles.inputGroup}>
                        {isRoomFromQR ? (
                            /* Room pre-filled from QR — show locked badge */
                            <div style={styles.lockedRoomBadge}>
                                <span style={styles.inputIcon}>🔑</span>
                                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1B4D3E' }}>Room {roomNumber}</span>
                                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>From QR</span>
                            </div>
                        ) : (
                            <div style={styles.inputWrap}>
                                <span style={styles.inputIcon}>🔑</span>
                                <input
                                    type="text"
                                    value={roomNumber}
                                    onChange={(e) => { setRoomNumber(e.target.value); setShowError(''); }}
                                    placeholder="Room Number *"
                                    style={styles.input}
                                    maxLength={20}
                                />
                            </div>
                        )}

                        <div style={styles.inputWrap}>
                            <span style={styles.inputIcon}>👤</span>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Your Name (optional)"
                                style={styles.input}
                                maxLength={100}
                            />
                        </div>

                        <div style={styles.inputWrap}>
                            <span style={styles.inputIcon}>📱</span>
                            <input
                                type="tel"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="Phone Number (optional)"
                                style={styles.input}
                                maxLength={20}
                            />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {showError && (
                    <p style={styles.errorText}>{showError}</p>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        ...styles.submitBtn,
                        opacity: isSubmitting ? 0.7 : 1,
                    }}
                >
                    {isSubmitting ? (
                        <Loader2 style={{ width: 22, height: 22, animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <>
                            <Send style={{ width: 20, height: 20 }} />
                            <span>Send Request</span>
                        </>
                    )}
                </button>

                <p style={{ ...styles.footerText, marginTop: '20px' }}>
                    Powered by <strong style={{ color: '#1B4D3E' }}>Kalalak</strong>
                </p>
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
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    formCard: {
        width: '100%',
        maxWidth: '480px',
        background: '#fff',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        marginTop: '16px',
        animation: 'fadeInUp 0.5s ease-out',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '28px',
    },
    backBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        flexShrink: 0,
    },
    formTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0,
        lineHeight: 1.2,
    },
    formSubtitle: {
        fontSize: '13px',
        color: '#64748b',
        margin: '2px 0 0',
    },
    hotelIconWrap: {
        marginLeft: 'auto',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(27,77,62,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    section: {
        marginBottom: '24px',
    },
    sectionLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
        marginBottom: '12px',
        display: 'block',
    },
    typeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
    },
    typeBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 8px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        background: '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    typeBtnSelected: {
        border: '1.5px solid #1B4D3E',
        background: 'rgba(27,77,62,0.04)',
        boxShadow: '0 0 0 3px rgba(27,77,62,0.08)',
    },
    typeIcon: {
        fontSize: '28px',
        lineHeight: 1,
    },
    typeLabel: {
        fontSize: '12px',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.3,
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    inputWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        background: '#fafafa',
        transition: 'border-color 0.2s',
    },
    lockedRoomBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1.5px solid rgba(27,77,62,0.2)',
        background: 'rgba(27,77,62,0.04)',
    },
    inputIcon: {
        fontSize: '18px',
        flexShrink: 0,
    },
    input: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        fontSize: '15px',
        color: '#0f172a',
        outline: 'none',
        fontFamily: 'inherit',
    },
    textarea: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        fontSize: '15px',
        color: '#0f172a',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '60px',
    },
    errorText: {
        color: '#ef4444',
        fontSize: '13px',
        textAlign: 'center',
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 8px 24px rgba(27,77,62,0.25)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
    },
    // Success screen styles
    successCard: {
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderRadius: '24px',
        padding: '40px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        textAlign: 'center',
        marginTop: '60px',
        animation: 'fadeInUp 0.5s ease-out',
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
    successTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
    },
    successMessage: {
        fontSize: '15px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: 1.5,
    },
    successDetail: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: '12px',
        background: '#f8fafc',
        marginBottom: '8px',
    },
    successLabel: {
        fontSize: '13px',
        color: '#94a3b8',
        fontWeight: '500',
    },
    successValue: {
        fontSize: '14px',
        color: '#0f172a',
        fontWeight: '600',
    },
    backToHomeBtn: {
        marginTop: '24px',
        padding: '14px 32px',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        background: '#fff',
        color: '#475569',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    footerText: {
        fontSize: '13px',
        color: '#94a3b8',
        margin: '24px 0 0',
        textAlign: 'center',
    },
};

export default ServiceRequestForm;
