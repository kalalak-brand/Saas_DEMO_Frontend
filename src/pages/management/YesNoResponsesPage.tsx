// src/pages/management/YesNoResponsesPage.tsx
import React, { useState, useEffect } from 'react';
import { useYesNoResponseStore, YesNoReviewResponse } from '../../stores/yesNoResponseStore.ts';
import { useActiveCategories } from '../../stores/categoryStore';
import { Download, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';




// --- Card Component ---
// Now accepts any category string
const ResponseCard: React.FC<{ review: YesNoReviewResponse; category: string }> = ({ review, category }) => {
    const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col gap-3">

            <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium text-gray-500">{formattedDate}</span>
                {/* Show Room # for 'room' */}
                {category === 'room' && review.guestInfo?.roomNumber && (
                    <span className="text-sm font-semibold text-primary">Room: {review.guestInfo.roomNumber}</span>
                )}
                {/* Show Email for 'f&b' or 'cfc' */}
                {(category === 'f&b' || category === 'cfc') && review.guestInfo?.email && (
                    <span className="text-sm font-semibold text-primary break-all">{review.guestInfo.email}</span>
                )}
            </div>

            {/* Guest Name (for 'room' only) */}
            {category === 'room' && review.guestInfo?.name && (
                <p className="text-base font-semibold text-gray-800">Guest: {review.guestInfo.name}</p>
            )}

            {/* Map through the yesNoAnswers array */}
            <div className="space-y-3 pt-2">
                {review.yesNoAnswers.map((qaPair, index) => (
                    <div key={index} className="border-b last:border-b-0 pb-2">
                        <p className="text-base font-medium text-gray-900">{qaPair.questionText}</p>
                        <p className={`text-lg font-semibold ${qaPair.answer ? 'text-green-600' : 'text-red-600'}`}>
                            _id:       Answer: {qaPair.answer ? 'Yes' : 'No'}
                        </p>
                        {/* ✅ ADDED: Show answerText if it exists */}
                        {qaPair.answerText && (
                            <p className="text-sm text-gray-700 mt-1 pl-4 bg-gray-50 p-1 rounded border border-gray-100">
                                <span className="font-medium">Details: </span>{qaPair.answerText}
                            </p>
                        )}
                    </div>
                ))}

                {/* Show message if no Yes/No answers were recorded */}
                {review.yesNoAnswers.length === 0 && (
                    <span className="italic text-gray-500 text-sm">No Yes/No answers recorded for this review.</span>
                )}
            </div>

            {/* Description (Show only if present) */}
            {review.description && (
                <div className="pt-2 border-t mt-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Overall Experience:</p>
                    <p className="text-base text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                        {review.description}
                    </p>
                </div>
            )}
        </div>
    );
};


// --- Main Page Component ---
const YesNoResponsesPage: React.FC = () => {
    // Get active categories dynamically
    const activeCategories = useActiveCategories();
    const [activeTab, setActiveTab] = useState<string>('');
    const today = new Date();
    const priorDate = new Date(new Date().setDate(today.getDate() - 30));
    const [startDate, setStartDate] = useState<string>(priorDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

    const { responses, isLoading, error, fetchResponses } = useYesNoResponseStore();

    // Set default tab when categories load
    useEffect(() => {
        if (activeCategories.length > 0 && !activeTab) {
            setActiveTab(activeCategories[0].slug);
        }
    }, [activeCategories, activeTab]);

    useEffect(() => {
        if (activeTab) {
            fetchResponses(activeTab, startDate, endDate);
        }
    }, [activeTab, startDate, endDate, fetchResponses]);

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        // ✅ CHANGED: Updated PDF columns
        const tableColumn = ["Date", "Guest", "Contact (Room/Email)", "Question", "Answer", "Description"];
        const tableRows: string[][] = [];

        doc.setFontSize(16);
        doc.text(`Yes/No Responses Report (${activeTab.toUpperCase()})`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 20);

        responses.forEach(review => {
            const formattedDate = new Date(review.createdAt).toLocaleDateString('en-CA');
            // ✅ CHANGED: Use guestInfo and show email for f&b/cfc
            const guest = review.guestInfo?.name || 'N/A';
            const contact = (activeTab === 'room' ? review.guestInfo?.roomNumber : review.guestInfo?.email) || 'N/A';
            const description = review.description || ''; // Use empty string for better merging

            if (review.yesNoAnswers.length > 0) {
                review.yesNoAnswers.forEach((qaPair, index) => {
                    const rowData: string[] = [
                        index === 0 ? formattedDate : '',
                        index === 0 ? guest : '',
                        index === 0 ? contact : '',
                        qaPair.questionText || 'N/A',
                        qaPair.answer ? 'Yes' : 'No',
                        index === 0 ? description : '', // Show description on first row
                    ];
                    tableRows.push(rowData);
                });
            }
            // ✅ CHANGED: Add row if ONLY description exists
            else if (review.description) {
                const rowData: string[] = [formattedDate, guest, contact, 'N/A', 'N/A', description];
                tableRows.push(rowData);
            }
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [101, 9, 51] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                3: { cellWidth: 50 }, // Question text
                5: { cellWidth: 60 } // Description
            }
        });

        doc.save(`yes-no-responses_${activeTab}_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-[50vh] overflow-y-scroll">
            <h1 className="text-3xl font-bold text-primary mb-6">Yes/No Question Responses</h1>

            {/* Filters: Date Range and Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow">
                {/* Date Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <label className='flex items-center gap-2'>
                        <span className="text-sm font-medium text-gray-700">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                    </label>
                    <label className='flex items-center gap-2'>
                        <span className="text-sm font-medium text-gray-700">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                    </label>
                </div>

                {/* Dynamic Category Tabs */}
                <div className="flex border-b border-gray-300 overflow-x-auto">
                    {activeCategories.length === 0 ? (
                        <p className="py-2 text-gray-500">No categories available</p>
                    ) : (
                        activeCategories.map((category) => (
                            <button
                                key={category.slug}
                                onClick={() => setActiveTab(category.slug)}
                                className={`py-2 px-6 text-base font-medium whitespace-nowrap ${activeTab === category.slug ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {category.name} Responses
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end mb-4 " >
                <button
                    onClick={handleDownloadPdf}
                    disabled={isLoading || responses.length === 0}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Download size={18} />
                    Download PDF
                </button>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <p className="text-center text-gray-500 mt-10">Loading responses...</p>
            ) : error ? (
                <p className="text-center text-red-600 mt-10">{error}</p>
            ) : responses.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 p-6 bg-white rounded-lg shadow">
                    s            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    {/* ✅ CHANGED: Updated empty message */}
                    <p className="text-lg">No responses with Yes/No answers or descriptions found for this period.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  ">
                    {responses.map((review) => (
                        <ResponseCard key={review._id} review={review} category={activeTab} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YesNoResponsesPage;