import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Tag,
  Award,
  Pencil,
  Trash2,
  Ticket,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { eventsApi, clubsApi, registrationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EventModal from '../components/EventModal';
import BookTicketModal from '../components/BookTicketModal';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORY_TABS = ['All', 'Technical', 'Cultural', 'Workshop', 'Sports', 'Seminar'];

export default function EventsPage() {
  const { user, isAuthenticated, isOrganizerOrAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [minSeats, setMinSeats] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState('date_asc');

  // Modals & Inline Sponsor
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [bookingEvent, setBookingEvent] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [deletingEvent, setDeletingEvent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [sponsorDrafts, setSponsorDrafts] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort };
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (freeOnly) params.freeOnly = 'true';
      if (minSeats !== '') params.minSeats = minSeats;
      if (tagFilter.trim()) params.tags = tagFilter.trim();

      const [eventsRes, clubsRes] = await Promise.all([
        eventsApi.list(params),
        clubsApi.list()
      ]);
      setEvents(eventsRes.events || []);
      setClubs(clubsRes.clubs || []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [search, category, freeOnly, minSeats, tagFilter, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const applyPreset = (preset) => {
    if (preset === 'all') {
      setSearch('');
      setCategory('All');
      setFreeOnly(false);
      setMinSeats('');
      setTagFilter('');
    } else if (preset === 'free_50') {
      setCategory('All');
      setFreeOnly(true);
      setMinSeats('50');
      setTagFilter('');
    } else if (preset === 'coding_hackathon') {
      setCategory('All');
      setFreeOnly(false);
      setMinSeats('');
      setTagFilter('coding,hackathon');
    }
  };

  const handleSaveEvent = async (payload) => {
    setSavingEvent(true);
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, payload);
        showToast('Event updated successfully!');
      } else {
        await eventsApi.create(payload);
        showToast('Event created successfully!');
      }
      setEventModalOpen(false);
      setEditingEvent(null);
      await fetchData();
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      await eventsApi.remove(deletingEvent.id);
      showToast(`Deleted "${deletingEvent.title}".`);
      setDeletingEvent(null);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete event.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBookTicket = async (payload) => {
    setBookingLoading(true);
    try {
      const res = await registrationsApi.create(payload);
      showToast(`Ticket booked! Pass ID: ${res.registration.ticketId}`);
      setBookingEvent(null);
      await fetchData();
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddSponsor = async (eventId) => {
    const name = (sponsorDrafts[eventId] || '').trim();
    if (!name) {
      showToast('Enter a sponsor name first.', 'error');
      return;
    }
    try {
      await eventsApi.addSponsor(eventId, name);
      setSponsorDrafts((prev) => ({ ...prev, [eventId]: '' }));
      showToast(`Added sponsor "${name}".`);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not add sponsor.', 'error');
    }
  };

  const handleRemoveSponsor = async (eventId, sponsorName) => {
    try {
      await eventsApi.removeSponsor(eventId, sponsorName);
      showToast(`Removed sponsor "${sponsorName}".`);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not remove sponsor.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Campus Event Engine & Ticket Hub
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Discover Campus Fests, Workshops & Live Passes
            </h1>
            <p className="mt-1.5 text-sm text-indigo-100">
              Atomic seat reservations, instant digital tickets, club communities, and real-time
              venue check-ins across all academic departments.
            </p>
          </div>
          {isOrganizerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setEventModalOpen(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          )}
        </div>
      </section>

      {/* Filters & Search Bar */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, code (EVT101), club, venue, or tag..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Tags (e.g. coding,ai)"
              className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="date_asc">Soonest First</option>
              <option value="seats_desc">Most Seats Available</option>
              <option value="fee_asc">Lowest Fee</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Category Tabs & Quick Query Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  category === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset(freeOnly && minSeats === '50' ? 'all' : 'free_50')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                freeOnly && minSeats === '50'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Free & &gt;50 Seats
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset(tagFilter === 'coding,hackathon' ? 'all' : 'coding_hackathon')
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                tagFilter === 'coding,hackathon'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Coding / Hackathon
            </button>
            {(search || category !== 'All' || freeOnly || minSeats || tagFilter) && (
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-slate-800">No matching campus events found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your search or tag filters, or create a new event.
          </p>
          <button
            type="button"
            onClick={() => applyPreset('all')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Show All Events
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const bookedCount = Math.max(0, ev.capacity - ev.seatsAvailable);
            const fillPct = ev.capacity > 0 ? Math.round((bookedCount / ev.capacity) * 100) : 0;
            const isSoldOut = ev.seatsAvailable <= 0;

            return (
              <article
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        {ev.eventCode}
                      </span>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {ev.category}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ev.entryFee === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {ev.entryFee === 0 ? 'FREE' : `₹${ev.entryFee}`}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-slate-900">{ev.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ev.description}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium text-slate-800">{ev.organizerClub}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      <span>{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>{new Date(ev.eventDate).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Seat Availability Bar */}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-medium">
                      <span className={isSoldOut ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {isSoldOut ? 'Sold Out' : `${ev.seatsAvailable} seats left`}
                      </span>
                      <span className="text-slate-400">
                        {bookedCount}/{ev.capacity} booked
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSoldOut ? 'bg-red-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, fillPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {ev.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ev.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTagFilter(t)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sponsors */}
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        Sponsors:
                      </span>
                      {ev.sponsors.length === 0 ? (
                        <span className="text-[11px] text-slate-400">None yet</span>
                      ) : (
                        ev.sponsors.map((sp) => (
                          <span
                            key={sp}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                          >
                            {sp}
                            {isOrganizerOrAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSponsor(ev.id, sp)}
                                className="hover:text-red-600"
                                title="Remove sponsor"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>

                    {isOrganizerOrAdmin && (
                      <div className="mt-2 flex gap-1.5">
                        <input
                          type="text"
                          value={sponsorDrafts[ev.id] || ''}
                          onChange={(e) =>
                            setSponsorDrafts((prev) => ({ ...prev, [ev.id]: e.target.value }))
                          }
                          placeholder="Add sponsor (e.g. CloudInc)"
                          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSponsor(ev.id)}
                          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                  {ev.myTicket ? (
                    <button
                      type="button"
                      onClick={() => navigate('/my-tickets')}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Ticket Booked ({ev.myTicket.ticketId})
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in to book a ticket.', 'info');
                          navigate('/auth');
                          return;
                        }
                        setBookingEvent(ev);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Ticket className="h-4 w-4" />
                      {isSoldOut ? 'Sold Out' : 'Book Ticket'}
                    </button>
                  )}

                  {isOrganizerOrAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(ev);
                          setEventModalOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100"
                        title="Edit event"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEvent(ev)}
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EventModal
        isOpen={eventModalOpen}
        event={editingEvent}
        clubs={clubs}
        loading={savingEvent}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSaveEvent}
      />

      <BookTicketModal
        isOpen={Boolean(bookingEvent)}
        event={bookingEvent}
        user={user}
        loading={bookingLoading}
        onClose={() => setBookingEvent(null)}
        onConfirm={handleBookTicket}
      />

      <ConfirmModal
        isOpen={Boolean(deletingEvent)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deletingEvent?.title}"? All associated ticket registrations for this event will also be removed.`}
        confirmLabel="Delete Event"
        loading={deleteLoading}
        onCancel={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}
