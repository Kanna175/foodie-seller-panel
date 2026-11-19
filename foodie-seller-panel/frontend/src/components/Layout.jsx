import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CloudOff,
  LayoutDashboard,
  Loader2,
  LogOut,
  Store,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, useMockMode } from '../api/client';
import { errMsg } from '../utils/format';
import Logo from './Logo';
import Switch from './Switch';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/earnings', label: 'Earnings', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: Store },
];

function Header() {
  const { session, logout, patchSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function toggleOnline(next) {
    setTogglingOnline(true);
    patchSession({ online: next }); // optimistic
    try {
      await api.setOnline(next);
      toast.success(next ? 'Store is now online' : 'Store is now offline');
    } catch (err) {
      patchSession({ online: !next });
      toast.error(errMsg(err));
    } finally {
      setTogglingOnline(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500">
            Store ID <span className="font-semibold text-gray-700">{session.storeId || `#${session.sellerId}`}</span>
          </p>
          <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">{session.restaurantName}</h1>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-surface py-1.5 pl-3 pr-2">
          <span
            className={`text-xs font-semibold ${session.online ? 'text-green-600' : 'text-gray-500'}`}
            aria-live="polite"
          >
            {session.online ? 'Online' : 'Offline'}
          </span>
          <Switch
            checked={!!session.online}
            onChange={toggleOnline}
            disabled={togglingOnline}
            label="Store online status"
          />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
          title="Log out"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition hover:bg-brand-100 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
        </button>
      </div>
    </header>
  );
}

export default function Layout() {
  const mock = useMockMode();

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink p-5 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={36} />
          <span className="text-2xl font-bold tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
            foodie
          </span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-300">
            Seller
          </span>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-white/10'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {mock && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
            <CloudOff size={14} className="shrink-0" />
            Backend not reachable. Showing demo data; changes are not saved to MySQL.
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-md justify-around">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                    isActive ? 'text-brand-600' : 'text-gray-400'
                  }`
                }
              >
                <Icon size={22} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
