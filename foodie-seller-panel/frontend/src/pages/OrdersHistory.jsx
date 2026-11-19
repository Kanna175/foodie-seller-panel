import { useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '../api/client';
import { errMsg, formatDateTime, formatINR } from '../utils/format';
import { StatusPill } from '../components/OrderQueue';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'DELIVERED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    api
      .getOrders('history')
      .then((data) => alive && setOrders(data))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'DELIVERED') return orders.filter((o) => o.status === 'DELIVERED');
    return orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED');
  }, [orders, filter]);

  return (
    <section aria-label="Orders history">
      <h2 className="text-xl font-bold">Orders history</h2>
      <p className="mb-4 text-sm text-gray-500">Completed and cancelled orders</p>

      <div className="mb-4 flex gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
              filter === f.id ? 'bg-ink text-white' : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : error ? (
        <p role="alert" className="card px-4 py-6 text-center text-sm font-medium text-brand-700">{error}</p>
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <History size={40} className="text-gray-300" />
          <p className="mt-3 font-semibold">No orders here yet</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold">#{o.orderNumber}</h3>
                  <p className="truncate text-sm text-gray-500">{o.customerName}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">{formatDateTime(o.createdAt)} · {o.paymentMode}</span>
                <span
                  className={`text-lg font-bold ${
                    o.status === 'DELIVERED' ? '' : 'text-gray-400 line-through decoration-1'
                  }`}
                >
                  {formatINR(o.total)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
