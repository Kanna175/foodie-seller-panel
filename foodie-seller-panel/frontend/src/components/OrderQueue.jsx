import { useState } from 'react';
import { Check, Inbox, Loader2, X } from 'lucide-react';
import { formatINR, STATUS, timeAgo } from '../utils/format';

export function StatusPill({ status }) {
  const meta = STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide ${meta.cls}`}>{meta.label}</span>
  );
}

function OrderCard({ order, busy, onAction }) {
  const { status } = order;

  function reject() {
    if (window.confirm(`Reject order #${order.orderNumber} from ${order.customerName}?`)) {
      onAction(order, 'REJECTED');
    }
  }

  return (
    <article className="card animate-fade-up p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">#{order.orderNumber}</h3>
          <p className="mt-0.5 truncate text-[15px] text-gray-500">{order.customerName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill status={status} />
          <span className="text-xs text-gray-400">
            {order.paymentMode} · {timeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      <ul className="my-3 space-y-2 border-y border-gray-100 py-3 text-[15px]">
        {order.items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex justify-between gap-3">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span className="text-gray-400">{formatINR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight">{formatINR(order.total)}</p>

        {status === 'PENDING' && (
          <div className="flex gap-2">
            <button type="button" className="btn-red" disabled={busy} onClick={reject}>
              <X size={18} /> Reject
            </button>
            <button type="button" className="btn-green" disabled={busy} onClick={() => onAction(order, 'ACCEPTED')}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Accept
            </button>
          </div>
        )}

        {status === 'ACCEPTED' && (
          <button type="button" className="btn-dark" disabled={busy} onClick={() => onAction(order, 'PREPARING')}>
            {busy && <Loader2 size={18} className="animate-spin" />} Mark Preparing
          </button>
        )}

        {status === 'PREPARING' && (
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => onAction(order, 'READY_FOR_PICKUP')}
          >
            {busy && <Loader2 size={18} className="animate-spin" />} Mark Ready for Pickup
          </button>
        )}

        {status === 'READY_FOR_PICKUP' && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[15px] italic text-gray-500">Awaiting rider</span>
            {/* Demo only: in production the rider app marks the pickup/delivery. */}
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(order, 'DELIVERED')}
              className="text-xs font-semibold text-brand-600 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Rider picked up (demo)
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function OrderQueue({ orders, loading, busyId, onAction }) {
  const [tab, setTab] = useState('pending');

  const pending = orders.filter((o) => o.status === 'PENDING');
  const active = orders.filter((o) => o.status !== 'PENDING');
  const list = tab === 'pending' ? pending : active;

  const tabs = [
    { id: 'pending', label: 'Pending Orders', count: pending.length },
    { id: 'active', label: 'Active Orders', count: active.length },
  ];

  return (
    <div>
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
              tab === t.id ? 'bg-ink text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <Inbox size={36} className="text-gray-300" />
          <p className="mt-3 font-semibold">
            {tab === 'pending' ? 'No new orders right now' : 'No active orders'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {tab === 'pending'
              ? 'New requests appear here automatically.'
              : 'Accepted orders will show up here while you prepare them.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}
