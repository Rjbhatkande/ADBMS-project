import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const CLUB_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Literature', 'Social'];

export default function ClubModal({ isOpen, club, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Technical',
    description: '',
    leadName: '',
    leadEmail: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setServerError('');
    if (club) {
      setForm({
        name: club.name || '',
        category: club.category || 'Technical',
        description: club.description || '',
        leadName: club.leadName || '',
        leadEmail: club.leadEmail || ''
      });
    } else {
      setForm({
        name: '',
        category: 'Technical',
        description: '',
        leadName: '',
        leadEmail: ''
      });
    }
  }, [isOpen, club]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Club name must be at least 2 characters.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      next.description = 'Description must be at least 10 characters.';
    }
    if (!form.leadName.trim()) {
      next.leadName = 'Club lead name is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.leadEmail.trim())) {
      next.leadEmail = 'Please enter a valid lead email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        leadName: form.leadName.trim(),
        leadEmail: form.leadEmail.trim()
      });
    } catch (err) {
      setServerError(err.message || 'Failed to save club.');
      if (err.errors) setErrors((prev) => ({ ...prev, ...err.errors }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {club ? `Edit ${club.name}` : 'Register New Campus Club'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Club Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Coding Club"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {CLUB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
              placeholder="What does this club organize on campus?"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Lead Name *
              </label>
              <input
                type="text"
                value={form.leadName}
                onChange={(e) => setForm({ ...form, leadName: e.target.value })}
                placeholder="Aarav Sharma"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.leadName && <p className="mt-1 text-xs text-red-600">{errors.leadName}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Lead Email *
              </label>
              <input
                type="email"
                value={form.leadEmail}
                onChange={(e) => setForm({ ...form, leadEmail: e.target.value })}
                placeholder="lead@college.edu"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.leadEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.leadEmail}</p>
              )}
            </div>
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
              {loading ? 'Saving...' : club ? 'Update Club' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
