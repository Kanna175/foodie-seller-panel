import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ChevronRight, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { errMsg, formatINR } from '../utils/format';
import AddDishModal from './AddDishModal';
import Switch from './Switch';
import VegBadge from './VegBadge';

/**
 * Restaurant menu: category filter, In-Stock toggles, Veg/Non-Veg badges, add / edit / delete.
 * Pass `limit` to show a preview (dashboard) with a "Manage full menu" button; omit it for the full view.
 */
export default function MenuSection({ title = 'Restaurant Menu', limit, showSearch = false }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // { item? }

  useEffect(() => {
    let alive = true;
    api
      .getMenu()
      .then((data) => alive && setItems(data))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const activeCategory = category === 'All' || categories.includes(category) ? category : 'All';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (activeCategory === 'All' || i.category === activeCategory) &&
        (!q || i.name.toLowerCase().includes(q))
    );
  }, [items, activeCategory, query]);

  const shown = limit ? filtered.slice(0, limit) : filtered;
  const inStockCount = items.filter((i) => i.inStock).length;

  async function toggleStock(item, next) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, inStock: next } : i))); // optimistic
    try {
      await api.setStock(item.id, next);
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, inStock: !next } : i)));
      toast.error(errMsg(err));
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.name}" from your menu?`)) return;
    try {
      await api.deleteMenuItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Dish deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  function onSaved(saved) {
    setItems((prev) => {
      const next = prev.some((i) => i.id === saved.id)
        ? prev.map((i) => (i.id === saved.id ? saved : i))
        : [...prev, saved];
      return next.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    });
  }

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {!loading && items.length > 0 && (
            <p className="text-sm text-gray-500">
              {inStockCount} of {items.length} dishes in stock
            </p>
          )}
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setModal({})}>
          <Plus size={18} /> Add New Dish
        </button>
      </div>

      {showSearch && items.length > 0 && (
        <div className="relative mb-3">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-11"
            placeholder="Search dishes"
            aria-label="Search dishes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {categories.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Category filter">
          {['All', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={activeCategory === c}
              onClick={() => setCategory(c)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                activeCategory === c ? 'bg-ink text-white' : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="card px-4 py-6 text-center text-sm font-medium text-brand-700">{error}</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <Store size={44} className="text-gray-300" />
          <p className="mt-3 text-lg font-bold">No dishes yet</p>
          <p className="mt-1 text-sm text-gray-500">Tap “Add New Dish” to build your menu.</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-gray-500">No dishes match your filter.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((item) => (
            <li key={item.id} className={`card flex gap-3 p-3 ${item.inStock ? '' : 'bg-gray-50'}`}>
              <div
                className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-500 ${
                  item.inStock ? '' : 'opacity-50 grayscale'
                }`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ChefHat size={30} />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <VegBadge veg={item.veg} />
                      <h3 className={`truncate font-bold ${item.inStock ? '' : 'text-gray-500'}`}>{item.name}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{item.category}</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button type="button" onClick={() => setModal({ item })} aria-label={`Edit ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => remove(item)} aria-label={`Delete ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-brand-50 hover:text-brand-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">{item.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <p className="text-lg font-bold">{formatINR(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${item.inStock ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                    <Switch
                      checked={item.inStock}
                      onChange={(next) => toggleStock(item, next)}
                      label={`${item.name} in stock`}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {limit && !loading && items.length > 0 && (
        <Link
          to="/menu"
          className="btn-dark mt-4 flex h-14 w-full justify-between rounded-2xl px-5 text-base"
        >
          Manage full menu ({items.length} dishes)
          <ChevronRight size={22} />
        </Link>
      )}

      {modal && (
        <AddDishModal
          item={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}
