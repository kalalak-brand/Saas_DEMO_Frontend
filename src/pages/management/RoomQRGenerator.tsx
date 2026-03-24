/**
 * RoomQRGenerator — Bulk room-specific QR code generator
 *
 * Generates QR codes for each room that embed the room number in the URL.
 * e.g., https://insight.kalalak.com/HOTELCODE/room/101
 *
 * When a guest scans this QR, the room number is pre-filled automatically
 * and locked — they can't change it. No manual entry needed.
 *
 * Features:
 *   - Set room range (e.g., 101–120) or custom list
 *   - Add floor prefix (e.g., Floor 1: 101-110, Floor 2: 201-210)
 *   - Bulk download as individual PNGs
 *   - Print-ready grid layout
 *   - Copy URL per room
 *
 * Time: O(n) QR generation, Space: O(n) where n = rooms
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuthStore } from '../../stores/authStore';
import {
    QrCode, Download, Printer, Copy, Check,
    Plus, Loader2
} from 'lucide-react';
import clsx from 'clsx';

interface RoomQR {
    roomNumber: string;
    url: string;
    qrDataUrl: string;
}

const RoomQRGenerator: React.FC = () => {
    const { user } = useAuthStore();
    const hotelCode = user?.hotelId?.code || '';
    const orgSlug = user?.organizationId?.slug || '';

    const baseUrl = import.meta.env.VITE_APP_URL || 'https://insight.kalalak.com';

    const [mode, setMode] = useState<'range' | 'custom'>('range');
    const [rangeStart, setRangeStart] = useState('101');
    const [rangeEnd, setRangeEnd] = useState('110');
    const [customRooms, setCustomRooms] = useState('');
    const [qrCodes, setQrCodes] = useState<RoomQR[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Time: O(n), Space: O(n) — n = number of rooms
    const generateQRCodes = useCallback(async () => {
        let rooms: string[] = [];

        if (mode === 'range') {
            const start = parseInt(rangeStart, 10);
            const end = parseInt(rangeEnd, 10);
            if (isNaN(start) || isNaN(end) || start > end || end - start > 500) return;
            for (let i = start; i <= end; i++) {
                rooms.push(String(i));
            }
        } else {
            rooms = customRooms
                .split(/[,\n]+/)
                .map((r) => r.trim())
                .filter(Boolean);
        }

        if (rooms.length === 0) return;
        setIsGenerating(true);

        const codes: RoomQR[] = await Promise.all(
            rooms.map(async (roomNumber) => {
                const url = orgSlug
                    ? `${baseUrl}/${orgSlug}/${hotelCode}/room/${roomNumber}`
                    : `${baseUrl}/${hotelCode}/room/${roomNumber}`;

                const qrDataUrl = await QRCode.toDataURL(url, {
                    width: 300,
                    margin: 2,
                    color: { dark: '#1B4D3E', light: '#FFFFFF' },
                    errorCorrectionLevel: 'M',
                });

                return { roomNumber, url, qrDataUrl };
            })
        );

        setQrCodes(codes);
        setIsGenerating(false);
    }, [mode, rangeStart, rangeEnd, customRooms, baseUrl, hotelCode, orgSlug]);

    // Auto-generate on first load
    useEffect(() => {
        if (hotelCode) generateQRCodes();
    }, [hotelCode]); // intentionally only on mount

    const handleDownload = (qr: RoomQR) => {
        const link = document.createElement('a');
        link.href = qr.qrDataUrl;
        link.download = `Room_${qr.roomNumber}_QR.png`;
        link.click();
    };

    const handleDownloadAll = async () => {
        for (const qr of qrCodes) {
            await new Promise((r) => setTimeout(r, 200));
            handleDownload(qr);
        }
    };

    const handleCopyUrl = async (qr: RoomQR) => {
        await navigator.clipboard.writeText(qr.url);
        setCopiedRoom(qr.roomNumber);
        setTimeout(() => setCopiedRoom(null), 2000);
    };

    const handlePrint = () => {
        const pw = window.open('', '_blank');
        if (!pw) return;

        pw.document.write(`<!DOCTYPE html><html><head>
        <title>Room QR Codes — ${hotelCode}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 24px; }
            .header h1 { font-size: 22px; color: #1B4D3E; }
            .header p { font-size: 13px; color: #64748b; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .card { text-align: center; padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; page-break-inside: avoid; }
            .card img { width: 150px; height: 150px; }
            .card .room { font-size: 20px; font-weight: 700; color: #1B4D3E; margin: 8px 0 4px; }
            .card .url { font-size: 9px; color: #94a3b8; word-break: break-all; }
            .card .scan { font-size: 11px; color: #64748b; margin-top: 6px; }
            @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
        </style></head><body>
        <div class="header">
            <h1>🏨 Room QR Codes</h1>
            <p>Scan to access room services — ${hotelCode}</p>
        </div>
        <div class="grid">
            ${qrCodes.map((qr) => `
                <div class="card">
                    <img src="${qr.qrDataUrl}" alt="Room ${qr.roomNumber}" />
                    <div class="room">Room ${qr.roomNumber}</div>
                    <div class="url">${qr.url}</div>
                    <div class="scan">Scan for service requests</div>
                </div>
            `).join('')}
        </div></body></html>`);

        pw.document.close();
        pw.focus();
        setTimeout(() => { pw.print(); pw.close(); }, 500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-primary" />
                        Room QR Codes
                    </h1>
                    <p className="text-sm text-secondary mt-1">
                        Generate QR codes for each room — pre-fills room number automatically
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadAll}
                        disabled={qrCodes.length === 0}
                        className={clsx(
                            'inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl',
                            'hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm',
                            qrCodes.length === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Download className="w-4 h-4" /> Download All
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={qrCodes.length === 0}
                        className={clsx(
                            'inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-primary-dark rounded-xl',
                            'hover:bg-background transition-colors text-sm font-medium',
                            qrCodes.length === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>

            {/* Room Configuration */}
            <div className="bg-surface rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-primary-dark mb-4">Room Configuration</h3>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setMode('range')}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            mode === 'range'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-background text-secondary hover:text-primary-dark'
                        )}
                    >
                        Room Range
                    </button>
                    <button
                        onClick={() => setMode('custom')}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            mode === 'custom'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-background text-secondary hover:text-primary-dark'
                        )}
                    >
                        Custom List
                    </button>
                </div>

                {mode === 'range' ? (
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">From</label>
                            <input
                                type="text"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                                className="w-28 px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="101"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">To</label>
                            <input
                                type="text"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                                className="w-28 px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="120"
                            />
                        </div>
                        <button
                            onClick={generateQRCodes}
                            disabled={isGenerating}
                            className={clsx(
                                'inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg',
                                'hover:bg-primary-dark transition-colors text-sm font-medium',
                                isGenerating && 'opacity-70'
                            )}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Generate
                        </button>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                            Enter room numbers (comma or newline separated)
                        </label>
                        <textarea
                            value={customRooms}
                            onChange={(e) => setCustomRooms(e.target.value)}
                            placeholder="101, 102, 103, 201, 202, Suite-A"
                            rows={3}
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                        />
                        <button
                            onClick={generateQRCodes}
                            disabled={isGenerating}
                            className={clsx(
                                'mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg',
                                'hover:bg-primary-dark transition-colors text-sm font-medium',
                                isGenerating && 'opacity-70'
                            )}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Generate
                        </button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isGenerating && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            )}

            {/* QR Codes Grid */}
            {qrCodes.length > 0 && (
                <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {qrCodes.map((qr) => (
                        <div
                            key={qr.roomNumber}
                            className="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow text-center"
                        >
                            <img
                                src={qr.qrDataUrl}
                                alt={`Room ${qr.roomNumber} QR`}
                                className="w-36 h-36 mx-auto mb-3 rounded-lg"
                            />
                            <p className="text-lg font-bold text-primary-dark mb-1">
                                Room {qr.roomNumber}
                            </p>
                            <p className="text-[10px] text-secondary truncate mb-3" title={qr.url}>
                                {qr.url}
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => handleDownload(qr)}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-medium"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleCopyUrl(qr)}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-background border border-border text-secondary rounded-lg hover:bg-surface transition-colors text-xs"
                                >
                                    {copiedRoom === qr.roomNumber ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {qrCodes.length === 0 && !isGenerating && (
                <div className="text-center py-16">
                    <QrCode className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                    <p className="text-secondary text-sm font-medium">No room QR codes generated yet</p>
                    <p className="text-secondary/60 text-xs mt-1">Set a room range or custom list above and click Generate</p>
                </div>
            )}
        </div>
    );
};

export default RoomQRGenerator;
