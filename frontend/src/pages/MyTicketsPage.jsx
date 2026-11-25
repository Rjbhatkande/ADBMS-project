import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Trash2,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { registrationsApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function MyTicketsPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingTicket, setCancellingTicket] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await registrationsApi.getMine();
      setTickets(res.registrations || []);
    } catch (err) {
      setError(err.message || 'Failed to load your tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCancelTicket = async () => {
    if (!cancellingTicket) return;
    setCancelLoading(true);
    try {
      await registrationsApi.remove(cancellingTicket.id);
      showToast('Ticket cancelled and seat returned to event.');
      setCancellingTicket(null);
      await loadTickets();
    } catch (err) {
      showToast(err.message || 'Could not cancel ticket.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Digital Event Passes</h1>
          <p className="text-sm text-slate-500">
            Show your Ticket ID at the venue entrance for instant check-in.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Browse More Events
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-2xl border bg-white p-6" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No tickets booked yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Explore upcoming hackathons, cultural nights, and workshops to reserve your seat.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-600" />
                  <span className="font-mono text-sm font-bold text-slate-900">{t.ticketId}</span>
                </div>
                {t.checkInStatus ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Checked In
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Check-In
                  </span>
                )}
              </div>

              <div className="space-y-3 p-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    {t.eventCode} · {t.organizerClub}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{t.eventTitle}</h2>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(t.eventDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{t.venue}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">Attendee: </span>
                    <span className="font-semibold text-slate-800">
                      {t.studentName} ({t.studentId})
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {t.paymentDetails.amountPaid === 0
                        ? 'FREE'
                        : `₹${t.paymentDetails.amountPaid} (${t.paymentDetails.method})`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <span>Registered {new Date(t.registrationDate).toLocaleDateString()}</span>
                {!t.checkInStatus && (
                  <button
                    type="button"
                    onClick={() => setCancellingTicket(t)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Cancel Ticket
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(cancellingTicket)}
        title="Cancel Ticket Registration"
        message={`Cancel ticket ${cancellingTicket?.ticketId} for "${cancellingTicket?.eventTitle}"? Your seat will be released back to the event pool.`}
        confirmLabel="Cancel Ticket"
        loading={cancelLoading}
        onCancel={() => setCancellingTicket(null)}
        onConfirm={handleCancelTicket}
      />
    </div>
  );
}
