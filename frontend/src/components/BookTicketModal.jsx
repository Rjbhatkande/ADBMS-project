import { useState } from 'react';
import { X, Ticket, CreditCard, Smartphone, Banknote, Sparkles } from 'lucide-react';

export default function BookTicketModal({ isOpen, event, user, onClose, onConfirm, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [error, setError] = useState('');

  if (!isOpen || !event) return null;

  const isFree = Number(event.entryFee) === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onConfirm({
        eventId: event.id,
        paymentMethod: isFree ? 'Free' : paymentMethod
      });
    } catch (err) {
      setError(err.message || 'Could not complete booking.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Confirm Event Registration</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
              {event.eventCode} · {event.organizerClub}
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">{event.title}</h3>
            <p className="mt-1 text-xs text-slate-600">
              {new Date(event.eventDate).toLocaleString()} · {event.venue}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-indigo-100 pt-2.5 text-sm">
              <span className="text-slate-600">Seats remaining: {event.seatsAvailable}</span>
              <span className="font-bold text-slate-900">
                {isFree ? 'FREE' : `₹${event.entryFee}`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Attendee Details
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
              <span className="text-slate-500">Student:</span>
              <span className="font-medium text-right">{user?.name}</span>
              <span className="text-slate-500">ID:</span>
              <span className="font-medium text-right">{user?.studentId}</span>
              <span className="text-slate-500">Department:</span>
              <span className="font-medium text-right">{user?.department}</span>
              <span className="text-slate-500">Year:</span>
              <span className="font-medium text-right">Year {user?.year}</span>
            </div>
          </div>

          {!isFree ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI', icon: Smartphone },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                  { id: 'Cash', label: 'Desk Cash', icon: Banknote }
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              <Sparkles className="h-4 w-4 shrink-0" />
              This is a free campus event! Your digital pass will be issued immediately.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Booking Seat...' : isFree ? 'Claim Free Ticket' : `Pay ₹${event.entryFee} & Book`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
