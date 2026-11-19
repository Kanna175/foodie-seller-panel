import { BellRing, ChefHat, Clock, IndianRupee } from 'lucide-react';
import { formatINR } from '../utils/format';

const CARDS = [
  {
    key: 'totalAmount',
    label: 'Total Amount',
    hint: 'Settled earnings',
    icon: IndianRupee,
    tint: 'bg-green-50 text-green-600',
    money: true,
  },
  {
    key: 'pendingAmount',
    label: 'Pending Amount',
    hint: 'Awaiting payout',
    icon: Clock,
    tint: 'bg-amber-50 text-amber-600',
    money: true,
  },
  {
    key: 'activeOrders',
    label: 'Active Orders',
    hint: 'In the kitchen / for pickup',
    icon: ChefHat,
    tint: 'bg-brand-50 text-brand-600',
  },
  {
    key: 'pendingOrders',
    label: 'Pending Orders',
    hint: 'Waiting for you to accept',
    icon: BellRing,
    tint: 'bg-gray-100 text-ink',
  },
];

export default function KpiCards({ summary, loading }) {
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ key, label, hint, icon: Icon, tint, money }) => (
        <div key={key} className="card p-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tint}`}>
            <Icon size={22} />
          </div>
          {loading && !summary ? (
            <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <p className="mt-4 text-2xl font-bold tracking-tight">
              {money ? formatINR(summary?.[key]) : summary?.[key] ?? 0}
            </p>
          )}
          <p className="mt-0.5 text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      ))}
    </section>
  );
}
