import { useEffect, useState } from 'react';
import { BadgeCheck, Clock, IndianRupee, Loader2, Receipt } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { errMsg, formatDate, formatINR } from '../utils/format';

export default function Earnings() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getEarnings()
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function requestPayout() {
    setRequesting(true);
    try {
      setData(await api.requestPayout());
      toast.success('Payout processed');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setRequesting(false);
    }
  }

  const pending = Number(data?.pendingAmount || 0);
  const total = Number(data?.totalAmount || 0);
  const grand = total + pending;
  const settledPct = grand > 0 ? Math.round((total / grand) * 100) : 0;

  return (
    <section aria-label="Earnings and payouts">
      <h2 className="text-xl font-bold">Earnings & Payouts</h2>
      <p className="mb-4 text-sm text-gray-500">Settled revenue vs. balance awaiting payout</p>

      {error && <p role="alert" className="card mb-4 px-4 py-6 text-center text-sm font-medium text-brand-700">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IndianRupee size={22} />
          </div>
          {loading ? <div className="mt-4 h-9 w-28 animate-pulse rounded-lg bg-gray-100" /> : (
            <p className="mt-4 text-3xl font-bold tracking-tight">{formatINR(total)}</p>
          )}
          <p className="mt-0.5 text-sm font-medium text-gray-700">Total Amount</p>
          <p className="text-xs text-gray-400">Settled to your bank account</p>
        </div>

        <div className="card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
          {loading ? <div className="mt-4 h-9 w-28 animate-pulse rounded-lg bg-gray-100" /> : (
            <p className="mt-4 text-3xl font-bold tracking-tight">{formatINR(pending)}</p>
          )}
          <p className="mt-0.5 text-sm font-medium text-gray-700">Pending Amount</p>
          <p className="text-xs text-gray-400">Delivered orders awaiting payout</p>
        </div>
      </div>

      {!loading && grand > 0 && (
        <div className="card mt-3 p-5">
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span className="text-green-700">Settled {settledPct}%</span>
            <span className="text-amber-700">Pending {100 - settledPct}%</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-amber-100" role="img" aria-label={`${settledPct}% settled`}>
            <div className="bg-green-500" style={{ width: `${settledPct}%` }} />
          </div>
          <button
            type="button"
            onClick={requestPayout}
            disabled={requesting || pending <= 0}
            className="btn-primary mt-4 h-12 w-full"
          >
            {requesting && <Loader2 size={18} className="animate-spin" />}
            {pending > 0 ? `Request payout of ${formatINR(pending)}` : 'Nothing pending to settle'}
          </button>
        </div>
      )}

      <h3 className="mb-3 mt-8 text-lg font-bold">Payout history</h3>
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : !data?.payouts?.length ? (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <Receipt size={38} className="text-gray-300" />
          <p className="mt-3 font-semibold">No payouts yet</p>
          <p className="mt-1 text-sm text-gray-500">Settlements will be listed here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.payouts.map((p) => (
            <li key={p.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <p className="font-semibold">{p.reference}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(p.paidAt)} · {p.orderCount} {p.orderCount === 1 ? 'order' : 'orders'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatINR(p.amount)}</p>
                <p className="text-xs font-semibold text-green-600">{p.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
