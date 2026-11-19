/** FSSAI-style Veg / Non-Veg mark. */
export default function VegBadge({ veg, withLabel = false }) {
  const color = veg ? 'border-green-600' : 'border-red-600';
  const dot = veg ? 'bg-green-600' : 'bg-red-600';
  return (
    <span className="inline-flex items-center gap-1.5" title={veg ? 'Veg' : 'Non-Veg'}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-[3px] border-2 bg-white ${color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {withLabel && <span className="text-xs font-medium text-gray-600">{veg ? 'Veg' : 'Non-Veg'}</span>}
    </span>
  );
}
