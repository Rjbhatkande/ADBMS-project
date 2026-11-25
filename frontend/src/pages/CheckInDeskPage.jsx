import { useCallback, useEffect, useState } from 'react';
import {
  ScanLine,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  UserCheck
} from 'lucide-react';
import { eventsApi, registrationsApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Performing Arts',
  'Electronics & Communication'
];

export default function CheckInDeskPage() {
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [ticketInput, setTicketInput] = useState('');
  const [checkingInInput, setCheckingInInput] = useState(false);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [eventId, setEventId] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [deletingReg, setDeletingReg] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (department !== 'All') params.department = department;
      if (eventId !== 'All') params.eventId = eventId;
      if (statusFilter !== 'All') params.checkInStatus = statusFilter;
      if (search.trim()) params.search = search.trim();

      const [regsRes, eventsRes] = await Promise.all([
        registrationsApi.list(params),
        eventsApi.list()
      ]);
      setRegistrations(regsRes.registrations || []);
      setEvents(eventsRes.events || []);
    } catch (err) {
      setError(err.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }, [department, eventId, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadData, 200);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    const id = ticketInput.trim();
    if (!id) {
      showToast('Enter a Ticket ID (e.g., TICK-2026-001).', 'error');
      return;
    }
    setCheckingInInput(true);
    try {
      const res = await registrationsApi.checkIn(id, true);
      showToast(res.message);
      setTicketInput('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Check-in failed.', 'error');
    } finally {
      setCheckingInInput(false);
    }
  };

  const handleToggleCheckIn = async (reg) => {
    try {
      const res = await registrationsApi.checkIn(reg.ticketId, !reg.checkInStatus);
      showToast(res.message);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Could not update check-in status.', 'error');
    }
  };

  const handleDeleteReg = async () => {
    if (!deletingReg) return;
    setDeleteLoading(true);
    try {
      await registrationsApi.remove(deletingReg.id);
      showToast(`Cancelled ${deletingReg.ticketId} and restored seat.`);
      setDeletingReg(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel registration.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Real-Time Ticket & Check-In Desk
        </h1>
        <p className="text-sm text-slate-500">
          Verify student passes at the venue gate, filter by academic department, and manage
          attendance.
        </p>
      </div>

      {/* Express Ticket Scanner / Check-In Bar */}
      <form
        onSubmit={handleQuickCheckIn}
        className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-2.5 text-indigo-800">
          <ScanLine className="h-6 w-6 shrink-0" />
          <div>
            <p className="text-sm font-bold">Express Gate Check-In</p>
            <p className="text-xs text-indigo-600">Enter Ticket ID to mark present immediately</p>
          </div>
        </div>
        <div className="flex flex-1 gap-2 sm:ml-4">
          <input
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
            placeholder="e.g., TICK-2026-001"
            className="flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 font-mono text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={checkingInInput}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            <UserCheck className="h-4 w-4" />
            {checkingInInput ? 'Checking...' : 'Check In'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, student, ID..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Departments' : d}
            </option>
          ))}
        </select>

        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="All">All Events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.eventCode} — {ev.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="All">All Check-In Statuses</option>
          <option value="true">Checked In Only</option>
          <option value="false">Pending Entry Only</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Registrations Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No registrations match the current filters.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      {reg.ticketId}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{reg.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {reg.studentId} · Year {reg.year}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{reg.department}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{reg.eventTitle}</p>
                      <p className="text-xs text-slate-400">{reg.eventCode}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold text-slate-800">
                        {reg.paymentDetails.amountPaid === 0
                          ? 'Free'
                          : `₹${reg.paymentDetails.amountPaid}`}
                      </span>
                      <span className="ml-1 text-slate-500">({reg.paymentDetails.method})</span>
                    </td>
                    <td className="px-4 py-3">
                      {reg.checkInStatus ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(reg)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            reg.checkInStatus
                              ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {reg.checkInStatus ? 'Undo Check-In' : 'Mark Present'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReg(reg)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Cancel registration"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deletingReg)}
        title="Cancel Student Registration"
        message={`Remove registration ${deletingReg?.ticketId} for ${deletingReg?.studentName}? This will free up 1 seat for "${deletingReg?.eventTitle}".`}
        confirmLabel="Cancel Registration"
        loading={deleteLoading}
        onCancel={() => setDeletingReg(null)}
        onConfirm={handleDeleteReg}
      />
    </div>
  );
}
