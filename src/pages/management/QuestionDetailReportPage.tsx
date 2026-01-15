// src/pages/reports/QuestionDetailReportPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLowRatedReportStore,
  LowRatedReview,
} from "../../stores/lowRatedReportStore";
import {
  ArrowLeft,
  ArrowDownUp,
  Phone,
  User,
  Home,
  Mail,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";

// Helper to get today's date in YYYY-MM-DD format
const getISODate = (offsetDays: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
};

// (No change here)
type SortKey = "date" | "point" | "roomNumber" | "guestName";
type SortOrder = "asc" | "desc";

const QuestionDetailReportPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const {
    reportData,
    isLoadingReport,
    error,
    fetchLowRatedReport,
    // ❗ We no longer need getQuestionById here
  } = useLowRatedReportStore();

  const [startDate, setStartDate] = useState(getISODate(-30));
  const [endDate, setEndDate] = useState(getISODate());
  const [roomFilter, setRoomFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("point");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ✅ --- START: FIX ---
  // Get the question text from the report data itself.
  // All items in the array will have the same question text, so we just grab the first one.
  const questionText = useMemo(() => {
    if (reportData.length > 0) {
      return reportData[0].questionText;
    }
    return "Loading question..."; // Default text while loading
  }, [reportData]); // (No change here)
  // ✅ --- END: FIX ---

  const handleRunReport = useCallback(() => {
    if (!questionId) {
      toast.error("No question selected.");
      return;
    }
    fetchLowRatedReport(questionId, startDate, endDate);
  }, [questionId, startDate, endDate, fetchLowRatedReport]); // (No change here)

  useEffect(() => {
    handleRunReport();
  }, [handleRunReport]); // (No change here)

  const filteredAndSortedData = useMemo(() => {
    // ... (rest of the function is correct)
    let data = [...reportData];
    if (roomFilter) {
      data = data.filter((item) =>
        item.roomNumber?.toLowerCase().includes(roomFilter.toLowerCase())
      );
    }
    data.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];
      if (valA === undefined || valA === null)
        valA = sortOrder === "asc" ? "zzz" : "aaa";
      if (valB === undefined || valB === null)
        valB = sortOrder === "asc" ? "zzz" : "aaa";
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [reportData, roomFilter, sortKey, sortOrder]); // (No change here)

  const handleSort = (key: SortKey) => {
    // ... (rest of the function is correct)
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }; // (No change here)

  const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    icon?: React.ReactNode;
  }> = ({ label, sortKey: key, icon }) => (
    // ... (rest of the component is correct)
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {" "}
      <button
        onClick={() => handleSort(key)}
        className="flex items-center gap-1 group"
      >
                {icon}        {label}
               {" "}
        <ArrowDownUp
          className={`h-4 w-4 ${
            sortKey === key
              ? "text-primary"
              : "text-gray-300 group-hover:text-gray-500"
          }`}
        />
             {" "}
      </button>
         {" "}
    </th>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-full">
           {" "}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary font-medium hover:underline mb-4"
      >
                <ArrowLeft size={18} />        Back to Questions List      {" "}
      </button>
           {" "}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Low Rating Report      {" "}
      </h1>
           {/* ✅ FIX 2: Use the new questionText variable */}     {" "}
      <h2 className="text-xl font-semibold text-primary mb-6">
                {questionText}     {" "}
      </h2>
            {/* (Rest of the component is correct) */}      {/* Filters Bar */} 
         {" "}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-wrap items-end gap-4">
        {/* ... all filters ... */}       {" "}
        <label className="flex-grow min-w-[150px]">
                   {" "}
          <span className="text-sm font-medium text-gray-700">From:</span>
                   {" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          />
                 {" "}
        </label>
               {" "}
        <label className="flex-grow min-w-[150px]">
                   {" "}
          <span className="text-sm font-medium text-gray-700">To:</span>
            S        {" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          />
                 {" "}
        </label>
               {" "}
        <label className="flex-grow min-w-[150px]">
                   {" "}
          <span className="text-sm font-medium text-gray-700">
            Filter by Room No:
          </span>
                  _{" "}
          <input
            type="text"
            placeholder="Enter Room No..."
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          />
                 {" "}
        </label>
               {" "}
        <button
          onClick={handleRunReport}
          disabled={isLoadingReport}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 disabled:opacity-50"
        >
                    {isLoadingReport ? "Reloading..." : "Run Report"}       {" "}
        </button>
             {" "}
      </div>
            {/* Report Table */}     {" "}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* ... table is correct ... */}       {" "}
        <div className="overflow-x-auto">
                   {" "}
          <table className="min-w-full divide-y divide-gray-200">
                       {" "}
            <thead className="bg-gray-50">
                           {" "}
              <tr>
                                <SortableHeader label="Date" sortKey="date" />
                               {" "}
                <SortableHeader
                  label="Guest Name"
                  sortKey="guestName"
                  icon={<User size={14} />}
                />
                               {" "}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={14} />
                  Phone
                </th>
                               {" "}
                <SortableHeader
                  label="Room No"
                  sortKey="roomNumber"
                  icon={<Home size={14} />}
                />
                               {" "}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={14} />
                  Email
                </th>
                               {" "}
                <SortableHeader
                  label="Rating"
                  sortKey="point"
                  icon={<Hash size={14} />}
                />
                             {" "}
              </tr>
                         {" "}
            </thead>
                       {" "}
            <tbody className="bg-white divide-y divide-gray-200">
                           {" "}
              {isLoadingReport ? (
                <tr>
                                   {" "}
                  <td colSpan={6} className="p-10 text-center animate-pulse">
                    Loading report...
                  </td>
                                 {" "}
                </tr>
              ) : error ? (
                <tr>
                                   {" "}
                  <td colSpan={6} className="p-10 text-center text-red-500">
                    {error}
                  </td>
                                 {" "}
                </tr>
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                                   {" "}
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                                        No reviews found with a rating of 5 or
                    below for this period.                  {" "}
                  </td>
                                 {" "}
                </tr>
              ) : (
                filteredAndSortedData.map((review: LowRatedReview) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                           {" "}
                      {new Date(review.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                                         {" "}
                    </td>
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {review.guestName || "-"}
                    </td>
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.phone || "-"}
                    </td>
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.roomNumber || "-"}
                    </td>
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.email || "-"}
                    </td>
                                       {" "}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {review.point} / 10
                    </td>
                                 {" "}
                  </tr>
                ))
              )}
                         {" "}
            </tbody>
                     {" "}
          </table>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default QuestionDetailReportPage;
