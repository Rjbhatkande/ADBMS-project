import { useCallback, useEffect, useState } from 'react';
import {
  IndianRupee,
  Ticket,
  CheckCircle2,
  CalendarDays,
  Building2,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { analyticsApi } from '../api/services';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsApi.overview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl border bg-white p-5" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border bg-white p-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={loadAnalytics}
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, revenueByEvent, departmentParticipation, turnoutByEvent } = data;
  const maxDeptRegs = Math.max(1, ...departmentParticipation.map((d) => d.totalRegistrations));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Campus Event Analytics Pipeline
          </h1>
          <p className="text-sm text-slate-500">
            Real-time MongoDB aggregation pipelines: revenue per club, department participation,
            and turnout rates.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wide">Total Revenue</span>
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            ₹{summary.totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">From completed ticket sales</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wide">Tickets Issued</span>
            <Ticket className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {summary.totalRegistrations}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary.totalSeatsAvailable} seats still open
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wide">Overall Turnout</span>
            <CheckCircle2 className="h-5 w-5 text-violet-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {summary.overallTurnoutRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary.totalCheckedIn} checked in at gate
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wide">Active Events</span>
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{summary.totalEvents}</p>
          <p className="mt-1 text-xs text-slate-500">Across {summary.totalClubs} campus clubs</p>
        </div>
      </div>

      {/* Revenue & Department Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Revenue per Event & Club */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Revenue per Event & Club</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Club</th>
                  <th className="py-2 pr-3 text-right">Sold</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueByEvent.map((row) => (
                  <tr key={row.eventId}>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-900">{row.eventTitle}</p>
                      <p className="text-xs text-slate-400">{row.eventCode}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{row.organizerClub}</td>
                    <td className="py-2.5 pr-3 text-right font-medium text-slate-800">
                      {row.totalTicketsSold}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      ₹{row.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Department Participation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Department Participation</h2>
          </div>

          {departmentParticipation.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No registrations yet.</p>
          ) : (
            <div className="space-y-4">
              {departmentParticipation.map((dept, idx) => {
                const widthPct = Math.round((dept.totalRegistrations / maxDeptRegs) * 100);
                return (
                  <div key={dept.department}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">
                        {idx === 0 && '🏆 '}
                        {dept.department}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {dept.totalRegistrations} registrations ({dept.checkedInCount} checked in)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 3. Turnout Rate by Event */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">
          Event Turnout Rate (Registered vs Checked-In)
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turnoutByEvent.map((ev) => (
            <div key={ev.eventId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600">{ev.eventCode}</span>
                  <h3 className="text-sm font-bold text-slate-900">{ev.eventTitle}</h3>
                </div>
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                  {ev.turnoutPercentage}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{ width: `${Math.min(100, ev.turnoutPercentage)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {ev.checkedInCount} checked in out of {ev.totalRegistrations} registered (Capacity:{' '}
                {ev.capacity})
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
