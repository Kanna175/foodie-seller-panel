import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../utils/format';

export default function Profile() {
  const { logout, patchSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [account, setAccount] = useState({ email: '', phone: '', storeId: '' });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .getProfile()
      .then((p) => {
        if (!alive) return;
        setAccount({ email: p.email, phone: p.phone, storeId: p.storeId });
        setForm({
          restaurantName: p.restaurantName ?? '',
          ownerName: p.ownerName ?? '',
          address: p.address ?? '',
          cuisine: p.cuisine ?? '',
          openingTime: p.openingTime ?? '10:00',
          closingTime: p.closingTime ?? '23:00',
          packagingCharge: p.packagingCharge ?? 0,
        });
      })
      .catch((err) => alive && setLoadError(errMsg(err)));
    return () => {
      alive = false;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    const charge = Number(form.packagingCharge);
    if (!form.restaurantName.trim()) return setError('Restaurant name is required');
    if (Number.isNaN(charge) || charge < 0) return setError('Enter a valid packaging charge');

    setSaving(true);
    try {
      const saved = await api.updateProfile({
        restaurantName: form.restaurantName.trim(),
        ownerName: form.ownerName.trim(),
        address: form.address.trim(),
        cuisine: form.cuisine.trim(),
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        packagingCharge: charge,
      });
      patchSession({ restaurantName: saved.restaurantName });
      toast.success('Profile saved');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (loadError) {
    return <p role="alert" className="card px-4 py-6 text-center text-sm font-medium text-brand-700">{loadError}</p>;
  }
  if (!form) return <div className="card h-96 animate-pulse" />;

  return (
    <section aria-label="Restaurant profile" className="mx-auto max-w-2xl">
      <h2 className="text-xl font-bold">Restaurant profile</h2>
      <p className="mb-4 text-sm text-gray-500">Store ID {account.storeId} · {account.email} · {account.phone}</p>

      <form onSubmit={save} className="card space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="p-name" className="label">Restaurant name</label>
          <input id="p-name" className="input" value={form.restaurantName} onChange={set('restaurantName')} maxLength={120} />
        </div>
        <div>
          <label htmlFor="p-owner" className="label">Owner name</label>
          <input id="p-owner" className="input" value={form.ownerName} onChange={set('ownerName')} maxLength={120} />
        </div>
        <div>
          <label htmlFor="p-address" className="label">Address</label>
          <input id="p-address" className="input" value={form.address} onChange={set('address')} maxLength={255} />
        </div>
        <div>
          <label htmlFor="p-cuisine" className="label">Cuisine</label>
          <input id="p-cuisine" className="input" value={form.cuisine} onChange={set('cuisine')} maxLength={120} placeholder="North Indian, Chinese" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-open" className="label">Opens at</label>
            <input id="p-open" type="time" className="input" value={form.openingTime} onChange={set('openingTime')} />
          </div>
          <div>
            <label htmlFor="p-close" className="label">Closes at</label>
            <input id="p-close" type="time" className="input" value={form.closingTime} onChange={set('closingTime')} />
          </div>
        </div>

        <div>
          <label htmlFor="p-pack" className="label">Packaging charge per order (₹)</label>
          <input id="p-pack" type="number" min="0" step="0.5" inputMode="decimal" className="input" value={form.packagingCharge} onChange={set('packagingCharge')} />
          <p className="mt-1 text-xs text-gray-400">Added to every new order and included in your earnings.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">{error}</p>
        )}

        <button type="submit" disabled={saving} className="btn-primary h-12 w-full">
          {saving && <Loader2 size={18} className="animate-spin" />}
          Save changes
        </button>
      </form>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-50 text-[15px] font-semibold text-brand-600 transition hover:bg-brand-100"
      >
        <LogOut size={18} /> Log out
      </button>
    </section>
  );
}
