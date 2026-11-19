export function formatINR(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Label + colours per order status (labels follow the Foodie app: PLACED, READY...). */
export const STATUS = {
  PENDING: { label: 'PLACED', cls: 'bg-brand-50 text-brand-600' },
  ACCEPTED: { label: 'ACCEPTED', cls: 'bg-amber-50 text-amber-700' },
  PREPARING: { label: 'PREPARING', cls: 'bg-orange-50 text-orange-600' },
  READY_FOR_PICKUP: { label: 'READY', cls: 'bg-brand-50 text-brand-600' },
  DELIVERED: { label: 'DELIVERED', cls: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'CANCELLED', cls: 'bg-gray-100 text-gray-600' },
  REJECTED: { label: 'REJECTED', cls: 'bg-gray-100 text-gray-600' },
};

export function errMsg(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The request timed out';
  return err?.message || fallback;
}
