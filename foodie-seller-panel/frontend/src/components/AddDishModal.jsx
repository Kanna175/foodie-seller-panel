import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../utils/format';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Add / edit dish. Image goes to the Node gateway (Multer) first, then the dish is saved with the returned URL. */
export default function AddDishModal({ item, categories, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? '',
    category: item?.category ?? '',
    veg: item?.veg ?? true,
    inStock: item?.inStock ?? true,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(item?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) return setError('Please choose a JPG, PNG or WebP image');
    if (f.size > MAX_BYTES) return setError('Image must be 5 MB or smaller');
    setError('');
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    if (!form.name.trim()) return setError('Enter the dish name');
    if (!form.category.trim()) return setError('Choose or enter a category');
    if (form.price === '' || Number.isNaN(price) || price < 0) return setError('Enter a valid price');

    setSaving(true);
    try {
      let imageUrl = item?.imageUrl || null;
      if (file) imageUrl = (await api.uploadImage(file)).url;

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim(),
        veg: form.veg,
        inStock: form.inStock,
        imageUrl,
      };
      const saved = isEdit ? await api.updateMenuItem(item.id, payload) : await api.addMenuItem(payload);
      onSaved(saved);
      toast.success(isEdit ? 'Dish updated' : 'Dish added to your menu');
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
        onSubmit={submit}
        className="animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="dish-modal-title" className="text-xl font-bold">
            {isEdit ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-gray-600 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image */}
          <div>
            <span className="label">Dish photo</span>
            <label className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-surface text-gray-400 transition hover:border-brand-500 hover:text-brand-600">
              {preview ? (
                <img src={preview} alt="Dish preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm font-medium">
                  <ImagePlus size={28} /> Tap to upload (JPG, PNG, WebP · max 5 MB)
                </span>
              )}
              <input type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={pickFile} />
            </label>
          </div>

          <div>
            <label htmlFor="dish-name" className="label">Dish name</label>
            <input id="dish-name" className="input" value={form.name} onChange={set('name')} maxLength={120} placeholder="e.g. Paneer Butter Masala" />
          </div>

          <div>
            <label htmlFor="dish-desc" className="label">Description <span className="text-gray-400">(optional)</span></label>
            <textarea
              id="dish-desc"
              rows={2}
              maxLength={500}
              value={form.description}
              onChange={set('description')}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              placeholder="Short line about the dish"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dish-price" className="label">Price (₹)</label>
              <input id="dish-price" type="number" inputMode="decimal" min="0" step="0.5" className="input" value={form.price} onChange={set('price')} placeholder="249" />
            </div>
            <div>
              <label htmlFor="dish-cat" className="label">Category</label>
              <input id="dish-cat" list="dish-categories" className="input" value={form.category} onChange={set('category')} maxLength={60} placeholder="Starters" />
              <datalist id="dish-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <fieldset>
            <legend className="label">Type</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: true, label: 'Veg', dot: 'bg-green-600', ring: 'border-green-600' },
                { v: false, label: 'Non-Veg', dot: 'bg-red-600', ring: 'border-red-600' },
              ].map((o) => (
                <label
                  key={o.label}
                  className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 text-[15px] font-semibold transition ${
                    form.veg === o.v ? `${o.ring} bg-white` : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <input type="radio" name="dish-type" className="sr-only" checked={form.veg === o.v} onChange={() => setForm((f) => ({ ...f, veg: o.v }))} />
                  <span className={`h-3 w-3 rounded-full ${o.dot}`} /> {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium">
            <input
              type="checkbox"
              className="h-5 w-5 rounded accent-green-600"
              checked={form.inStock}
              onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
            />
            Available now (in stock)
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary h-12 w-full">
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add dish'}
          </button>
        </div>
      </form>
    </div>
  );
}
