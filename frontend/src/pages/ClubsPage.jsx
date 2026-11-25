import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  Eye,
  X
} from 'lucide-react';
import { clubsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ClubModal from '../components/ClubModal';
import ConfirmModal from '../components/ConfirmModal';

export default function ClubsPage() {
  const { isAuthenticated, isOrganizerOrAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [savingClub, setSavingClub] = useState(false);

  const [deletingClub, setDeletingClub] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedClubDetail, setSelectedClubDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await clubsApi.list();
      setClubs(res.clubs || []);
    } catch (err) {
      setError(err.message || 'Failed to load clubs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleSaveClub = async (payload) => {
    setSavingClub(true);
    try {
      if (editingClub) {
        await clubsApi.update(editingClub.id, payload);
        showToast('Club updated successfully!');
      } else {
        await clubsApi.create(payload);
        showToast('Club created successfully!');
      }
      setClubModalOpen(false);
      setEditingClub(null);
      await loadClubs();
    } finally {
      setSavingClub(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!deletingClub) return;
    setDeleteLoading(true);
    try {
      await clubsApi.remove(deletingClub.id);
      showToast(`Deleted "${deletingClub.name}".`);
      setDeletingClub(null);
      await loadClubs();
    } catch (err) {
      showToast(err.message || 'Could not delete club.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleMembership = async (club) => {
    if (!isAuthenticated) {
      showToast('Please sign in to join a campus club.', 'info');
      navigate('/auth');
      return;
    }
    try {
      if (club.isMember) {
        await clubsApi.leave(club.id);
        showToast(`Left ${club.name}.`);
      } else {
        await clubsApi.join(club.id);
        showToast(`Joined ${club.name}!`);
      }
      await loadClubs();
    } catch (err) {
      showToast(err.message || 'Could not update membership.', 'error');
    }
  };

  const handleViewMembers = async (clubId) => {
    setDetailLoading(true);
    try {
      const res = await clubsApi.getById(clubId);
      setSelectedClubDetail(res.club);
    } catch (err) {
      showToast(err.message || 'Failed to load club members.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Campus Clubs & Societies</h1>
          <p className="text-sm text-slate-500">
            Join student organizations, track club-hosted events, and connect with coordinators.
          </p>
        </div>
        {isOrganizerOrAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingClub(null);
              setClubModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Club
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-60 animate-pulse rounded-2xl border bg-white p-6" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {club.category}
                  </span>
                  {club.isMember && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      Member
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-900">{club.name}</h2>
                <p className="mt-1.5 text-sm text-slate-600">{club.description}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Lead: <strong className="text-slate-800">{club.leadName}</strong> (
                      {club.leadEmail})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-1 font-medium text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {club.memberCount} members
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                      {club.eventCount} events
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleToggleMembership(club)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    club.isMember
                      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {club.isMember ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Leave Club
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Join Club
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleViewMembers(club.id)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                  title="View members"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {isOrganizerOrAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClub(club);
                        setClubModalOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                      title="Edit club"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClub(club)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-red-50 hover:text-red-600"
                      title="Delete club"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Club Members Modal */}
      {(selectedClubDetail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {detailLoading ? 'Loading members...' : `${selectedClubDetail?.name} Members`}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedClubDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {selectedClubDetail && (
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                {selectedClubDetail.members.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No members have joined this club yet.
                  </p>
                ) : (
                  selectedClubDetail.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="text-xs text-slate-500">
                          {m.studentId} · {m.department} (Year {m.year})
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-700">
                        {m.memberRole}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ClubModal
        isOpen={clubModalOpen}
        club={editingClub}
        loading={savingClub}
        onClose={() => {
          setClubModalOpen(false);
          setEditingClub(null);
        }}
        onSubmit={handleSaveClub}
      />

      <ConfirmModal
        isOpen={Boolean(deletingClub)}
        title="Delete Club"
        message={`Delete "${deletingClub?.name}"? Note: clubs with existing events cannot be deleted until those events are removed.`}
        confirmLabel="Delete Club"
        loading={deleteLoading}
        onCancel={() => setDeletingClub(null)}
        onConfirm={handleDeleteClub}
      />
    </div>
  );
}
