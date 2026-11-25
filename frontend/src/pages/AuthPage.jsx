import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Electronics & Communication',
  'Performing Arts',
  'Civil Engineering'
];

export default function AuthPage() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    studentId: '',
    name: '',
    email: '',
    password: '',
    department: 'Computer Science',
    year: 1,
    role: 'student'
  });

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setServerError('');
    setErrors({});
  };

  const validateLogin = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!loginForm.password) {
      next.password = 'Password is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegister = () => {
    const next = {};
    if (!regForm.studentId.trim() || regForm.studentId.trim().length < 3) {
      next.studentId = 'Student ID must be at least 3 characters.';
    }
    if (!regForm.name.trim() || regForm.name.trim().length < 2) {
      next.name = 'Full name must be at least 2 characters.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (regForm.password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const res = await login(loginForm);
      showToast(`Welcome back, ${res.user.name}!`);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Login failed.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateRegister()) return;

    setLoading(true);
    try {
      const res = await register({
        ...regForm,
        year: Number(regForm.year)
      });
      showToast(`Account created! Welcome, ${res.user.name}.`);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Registration failed.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setMode('login');
    setErrors({});
    setServerError('');
    setLoginForm({ email, password: 'Campus@2026' });
  };

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign in to CampusHub' : 'Create Campus Account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Book event tickets, join clubs, and track campus passes.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        {serverError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                College Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="priya@college.edu"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Demo Quick-Fill */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <p className="mb-2 font-semibold text-slate-600">
                Seeded Demo Accounts (Password: <code>Campus@2026</code>)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('priya@college.edu')}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                >
                  Fill Student (Priya)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('aarav@college.edu')}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                >
                  Fill Admin (Aarav)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Student / Staff ID
                </label>
                <input
                  type="text"
                  value={regForm.studentId}
                  onChange={(e) =>
                    setRegForm({ ...regForm, studentId: e.target.value.toUpperCase() })
                  }
                  placeholder="STU2026"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {errors.studentId && (
                  <p className="mt-1 text-xs text-red-600">{errors.studentId}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Priya Verma"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                College Email
              </label>
              <input
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                placeholder="you@college.edu"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password (min 6 chars)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="Create a secure password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Department
                </label>
                <select
                  value={regForm.department}
                  onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Year
                </label>
                <select
                  value={regForm.year}
                  onChange={(e) => setRegForm({ ...regForm, year: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Account Type
              </label>
              <select
                value={regForm.role}
                onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="student">Student (Book tickets & join clubs)</option>
                <option value="organizer">Club Organizer (Create events & check-in)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
