import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../utils/format';
import KpiCards from '../components/KpiCards';
import OrderQueue from '../components/OrderQueue';
import MenuSection from '../components/MenuSection';

const SUCCESS_MESSAGE = {
  ACCEPTED: 'Order accepted',
  REJECTED: 'Order rejected',
  PREPARING: 'Marked as preparing',
  READY_FOR_PICKUP: 'Ready for rider pickup',
  DELIVERED: 'Order delivered',
};

export default function Dashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      try {
        const [s, q] = await Promise.all([api.getSummary(), api.getOrders('queue')]);
        setSummary(s);
        setQueue(q);
      } catch (err) {
        if (!silent) toast.error(errMsg(err));
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Live queue: initial load + refresh every 15 seconds.
  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function handleAction(order, status) {
    setBusyId(order.id);
    try {
      await api.updateOrderStatus(order.id, status);
      toast.success(SUCCESS_MESSAGE[status] || 'Order updated');
      await load(true);
    } catch (err) {
      toast.error(errMsg(err));
      load(true); // state may have changed elsewhere
    } finally {
      setBusyId(null);
    }
  }

  async function simulate() {
    setSimulating(true);
    try {
      await api.simulateOrder();
      toast.success('New demo order received');
      await load(true);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-8">
      <KpiCards summary={summary} loading={loading} />

      <section aria-label="Live order queue">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Incoming orders</h2>
          <button
            type="button"
            onClick={simulate}
            disabled={simulating}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-gray-600 shadow-card transition hover:bg-gray-50 disabled:opacity-60"
            title="Demo helper: creates a random incoming order"
          >
            <Sparkles size={14} className="text-brand-600" />
            Simulate order
          </button>
        </div>
        <OrderQueue orders={queue} loading={loading} busyId={busyId} onAction={handleAction} />
      </section>

      <MenuSection title="Restaurant Menu" limit={6} />
    </div>
  );
}
