import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode, ExternalLink, Copy, Check } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';

interface QRCodeData {
    categoryId: string;
    categoryName: string;
    slug: string;
    url: string;
    qrDataUrl: string;
}

const QRCodesPage: React.FC = () => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Get base URL from environment or default
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        const generateQRCodes = async () => {
            if (categories.length === 0) return;

            const codes: QRCodeData[] = await Promise.all(
                categories.map(async (cat) => {
                    const url = `${baseUrl}/${cat.slug}`;
                    const qrDataUrl = await QRCode.toDataURL(url, {
                        width: 256,
                        margin: 2,
                        color: {
                            dark: '#1F2937',
                            light: '#FFFFFF',
                        },
                    });
                    return {
                        categoryId: cat._id,
                        categoryName: cat.name,
                        slug: cat.slug,
                        url,
                        qrDataUrl,
                    };
                })
            );
            setQrCodes(codes);
        };

        generateQRCodes();
    }, [categories, baseUrl]);

    const handleDownload = (qrData: QRCodeData) => {
        const link = document.createElement('a');
        link.href = qrData.qrDataUrl;
        link.download = `QR_${qrData.categoryName.replace(/\s+/g, '_')}.png`;
        link.click();
    };

    const handleDownloadAll = async () => {
        for (const qrData of qrCodes) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            handleDownload(qrData);
        }
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Hotel Review</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
            .qr-card { text-align: center; padding: 20px; border: 2px solid #E5E7EB; border-radius: 12px; page-break-inside: avoid; }
            .qr-card img { width: 180px; height: 180px; }
            .qr-card h3 { margin: 15px 0 5px; font-size: 18px; color: #1F2937; }
            .qr-card p { font-size: 12px; color: #6B7280; word-break: break-all; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #4F46E5; margin-bottom: 5px; }
            @media print { .qr-grid { grid-template-columns: repeat(2, 1fr); } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏨 Guest Review QR Codes</h1>
            <p>Scan to submit feedback</p>
          </div>
          <div class="qr-grid">
            ${qrCodes.map(qr => `
              <div class="qr-card">
                <img src="${qr.qrDataUrl}" alt="${qr.categoryName} QR Code" />
                <h3>${qr.categoryName}</h3>
                <p>${qr.url}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleCopyUrl = async (qrData: QRCodeData) => {
        await navigator.clipboard.writeText(qrData.url);
        setCopiedId(qrData.categoryId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <QrCode className="w-7 h-7 text-primary" />
                        QR Codes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Generate and download QR codes for guest review forms
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download All
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Print All
                    </button>
                </div>
            </div>

            {/* QR Codes Grid */}
            <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {qrCodes.map((qrData) => (
                    <div
                        key={qrData.categoryId}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                    >
                        {/* QR Code Image */}
                        <div className="flex justify-center mb-4">
                            <img
                                src={qrData.qrDataUrl}
                                alt={`${qrData.categoryName} QR Code`}
                                className="w-48 h-48 rounded-lg"
                            />
                        </div>

                        {/* Category Name */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                            {qrData.categoryName}
                        </h3>

                        {/* URL */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                                /{qrData.slug}
                            </code>
                            <button
                                onClick={() => handleCopyUrl(qrData)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Copy URL"
                            >
                                {copiedId === qrData.categoryId ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDownload(qrData)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <a
                                href={qrData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {qrCodes.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No categories found. Create categories first.</p>
                </div>
            )}
        </div>
    );
};

export default QRCodesPage;
