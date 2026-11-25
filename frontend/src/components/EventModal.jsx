import { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EventModal({ isOpen, event, clubs, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    eventCode: '',
    title: '',
    description: '',
    category: 'Technical',
    clubId: '',
    venue: '',
    eventDate: '',
    capacity: 100,
    entryFee: 0,
    tagsText: '',
    sponsorsText: '',
    coordinators: [{ name: '', contact: '' }]
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setServerError('');

    if (event) {
      setForm({
        eventCode: event.eventCode || '',
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'Technical',
        clubId: String(event.clubId || clubs[0]?.id || ''),
        venue: event.venue || '',
        eventDate: toDatetimeLocal(event.eventDate),
        capacity: event.capacity ?? 100,
        entryFee: event.entryFee ?? 0,
        tagsText: (event.tags || []).join(', '),
        sponsorsText: (event.sponsors || []).join(', '),
        coordinators:
          event.coordinators && event.coordinators.length > 0
            ? event.coordinators.map((c) => ({ name: c.name, contact: c.contact }))
            : [{ name: '', contact: '' }]
      });
    } else {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setForm({
        eventCode: '',
        title: '',
        description: '',
        category: 'Technical',
        clubId: String(clubs[0]?.id || ''),
        venue: '',
        eventDate: toDatetimeLocal(nextWeek),
        capacity: 100,
        entryFee: 0,
        tagsText: '',
        sponsorsText: '',
        coordinators: [{ name: '', contact: '' }]
      });
    }
  }, [isOpen, event, clubs]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.title.trim() || form.title.trim().length < 3) {
      next.title = 'Title must be at least 3 characters.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      next.description = 'Description must be at least 10 characters.';
    }
    if (!form.clubId) {
      next.clubId = 'Please select an organizing club.';
    }
    if (!form.venue.trim()) {
      next.venue = 'Venue is required.';
    }
    if (!form.eventDate) {
      next.eventDate = 'Event date & time is required.';
    }
    if (Number(form.capacity) < 1) {
      next.capacity = 'Capacity must be at least 1.';
    }
    if (Number(form.entryFee) < 0) {
      next.entryFee = 'Entry fee cannot be negative.';
    }
    const validCoords = form.coordinators.filter((c) => c.name.trim() && c.contact.trim());
    if (validCoords.length === 0) {
      next.coordinators = 'Add at least one coordinator with name and contact.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      ...(form.eventCode.trim() && !event ? { eventCode: form.eventCode.trim() } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      clubId: form.clubId,
      venue: form.venue.trim(),
      eventDate: new Date(form.eventDate).toISOString(),
      capacity: Number(form.capacity),
      entryFee: Number(form.entryFee),
      tags: form.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      sponsors: form.sponsorsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      coordinators: form.coordinators
        .filter((c) => c.name.trim() && c.contact.trim())
        .map((c) => ({ name: c.name.trim(), contact: c.contact.trim() }))
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setServerError(err.message || 'Failed to save event.');
      if (err.errors) setErrors((prev) => ({ ...prev, ...err.errors }));
    }
  };

  const updateCoordinator = (idx, key, val) => {
    setForm((prev) => ({
      ...prev,
      coordinators: prev.coordinators.map((c, i) => (i === idx ? { ...c, [key]: val } : c))
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {event ? `Edit Event (${event.eventCode})` : 'Create New Campus Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-6">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Event Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., HackCampus 2026"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Event Code {event ? '(Fixed)' : '(Optional)'}
              </label>
              <input
                type="text"
                disabled={Boolean(event)}
                value={form.eventCode}
                onChange={(e) => setForm({ ...form, eventCode: e.target.value.toUpperCase() })}
                placeholder="Auto (e.g. EVT105)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Description *
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the event agenda, eligibility, and highlights..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Organizing Club *
              </label>
              <select
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select a club</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
              {errors.clubId && <p className="mt-1 text-xs text-red-600">{errors.clubId}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Venue *
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g., Auditorium A"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.venue && <p className="mt-1 text-xs text-red-600">{errors.venue}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.eventDate && (
                <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Total Capacity *
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.capacity && (
                <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Entry Fee (₹) *
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={form.entryFee}
                onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.entryFee && (
                <p className="mt-1 text-xs text-red-600">{errors.entryFee}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tagsText}
                onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                placeholder="hackathon, coding, prizes"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Sponsors (comma separated)
              </label>
              <input
                type="text"
                value={form.sponsorsText}
                onChange={(e) => setForm({ ...form, sponsorsText: e.target.value })}
                placeholder="TechCorp, DevStudio"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Coordinators *
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    coordinators: [...prev.coordinators, { name: '', contact: '' }]
                  }))
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add Coordinator
              </button>
            </div>
            <div className="space-y-2">
              {form.coordinators.map((coord, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={coord.name}
                    onChange={(e) => updateCoordinator(idx, 'name', e.target.value)}
                    placeholder="Coordinator Name"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={coord.contact}
                    onChange={(e) => updateCoordinator(idx, 'contact', e.target.value)}
                    placeholder="Email / Phone"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  {form.coordinators.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          coordinators: prev.coordinators.filter((_, i) => i !== idx)
                        }))
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.coordinators && (
              <p className="mt-1 text-xs text-red-600">{errors.coordinators}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
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
              {loading ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
