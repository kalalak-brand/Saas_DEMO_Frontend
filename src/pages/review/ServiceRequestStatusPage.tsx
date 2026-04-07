import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Clock, Loader2, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Status = 'pending' | 'in_progress' | 'completed' | 'escalated';

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  escalated: 'Escalated',
};

const etaRangeForDepartment = (department?: string): { min: number; max: number } => {
  const d = (department || '').toLowerCase();
  if (d.includes('house')) return { min: 10, max: 20 };
  if (d.includes('room service')) return { min: 15, max: 30 };
  if (d.includes('maint')) return { min: 20, max: 45 };
  return { min: 15, max: 35 };
};

const ServiceRequestStatusPage: React.FC = () => {
  const { hotelCode, requestId } = useParams<{ hotelCode: string; requestId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`${API_BASE}/public/service-requests/${requestId}/status`)
      .then((res) => {
        if (!mounted) return;
        setReq(res.data?.data?.request || null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [requestId]);

  const eta = useMemo(() => etaRangeForDepartment(req?.department), [req?.department]);
  const status: Status | undefined = req?.status;
  const dotColor =
    status === 'completed' ? '#22c55e' : status === 'in_progress' ? '#22c55e' : '#f59e0b';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6">
          <p className="text-sm text-secondary">Request not found.</p>
          <button
            onClick={() => navigate(`/${hotelCode}`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <button
          onClick={() => navigate(`/${hotelCode}`)}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-secondary">Request ID</p>
              <p className="text-lg font-bold text-primary-dark">{req.requestId || '—'}</p>
              <p className="text-sm text-secondary mt-1">Room {req.guestInfo?.roomNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary">Status</p>
              <p className="text-sm font-semibold text-primary-dark inline-flex items-center gap-2">
                <span style={{ color: dotColor }}>●</span>
                {statusLabel[req.status] || req.status}
              </p>
            </div>
          </div>

          {req.status !== 'completed' ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-secondary">
              <Clock className="w-4 h-4 text-primary" />
              Expected within <span className="font-semibold text-primary-dark">{eta.min}–{eta.max}</span> minutes
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
          )}

          <p className="mt-3 text-sm text-secondary">
            If there’s any delay, our team is automatically alerted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestStatusPage;

