import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../utils/format';
import Logo from '../components/Logo';

export default function Login() {
  const { session, login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
  });

  if (session) return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function run(action) {
    setError('');
    setLoading(true);
    try {
      await action();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === 'login') {
      if (!form.identifier.trim() || !form.password) return setError('Enter your mobile/email and password');
      return run(() => login(form.identifier.trim(), form.password));
    }
    if (!form.restaurantName.trim() || !form.ownerName.trim()) return setError('Enter your restaurant and owner name');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Enter a valid 10-digit mobile number');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    return run(() =>
      register({
        restaurantName: form.restaurantName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      })
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="flex flex-col items-center px-6 pb-8 pt-12 md:pt-16">
        <Logo size={84} withWordmark wordmarkClass="text-white" />
        <p className="mt-2 text-sm font-medium text-gray-400">Seller Panel</p>
      </div>

      <main className="mx-auto w-full max-w-md flex-1 rounded-t-[2rem] bg-white px-6 pb-10 pt-7 md:mb-12 md:flex-none md:rounded-[2rem]">
        <div role="tablist" className="mb-6 grid grid-cols-2 rounded-2xl bg-surface p-1">
          {[
            ['login', 'Login'],
            ['register', 'Register'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => switchMode(id)}
              className={`h-10 rounded-xl text-sm font-semibold transition ${
                mode === id ? 'bg-white shadow-card' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your seller account'}</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          {mode === 'login'
            ? 'Log in to manage orders, menu and earnings.'
            : 'Start receiving orders on Foodie in minutes.'}
        </p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="restaurantName" className="label">Restaurant name</label>
                <input id="restaurantName" className="input" value={form.restaurantName} onChange={set('restaurantName')} autoComplete="organization" />
              </div>
              <div>
                <label htmlFor="ownerName" className="label">Owner name</label>
                <input id="ownerName" className="input" value={form.ownerName} onChange={set('ownerName')} autoComplete="name" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="label">Mobile number</label>
                  <input id="phone" className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} autoComplete="tel-national" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input id="email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label htmlFor="identifier" className="label">Mobile number or email</label>
              <input id="identifier" className="input" value={form.identifier} onChange={set('identifier')} autoComplete="username" placeholder="9876543210 or you@restaurant.com" />
            </div>
          )}

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-12"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:text-ink"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary h-12 w-full text-base">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => run(demoLogin)}
              className="btn-dark h-12 w-full text-base"
            >
              <Zap size={18} /> Demo Seller Login
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">
              Demo account: demo@foodie.in / demo123
            </p>
          </>
        )}
      </main>
    </div>
  );
}
