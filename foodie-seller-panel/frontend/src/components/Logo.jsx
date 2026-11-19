/** Foodie logo: red "cookie" circle with a bite and four chips (matches the app splash screen). */
export default function Logo({ size = 72, withWordmark = false, wordmarkClass = 'text-white' }) {
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 286 286" role="img" aria-label="Foodie logo">
        <defs>
          <mask id="foodie-bite">
            <rect width="286" height="286" fill="white" />
            <circle cx="218" cy="66" r="58" fill="black" />
          </mask>
        </defs>
        <circle cx="143" cy="143" r="143" fill="#dc3545" mask="url(#foodie-bite)" />
        <g fill="#1c1c1c">
          <circle cx="149" cy="97" r="7" />
          <circle cx="182" cy="135" r="7" />
          <circle cx="103" cy="150" r="7" />
          <circle cx="135" cy="187" r="7" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className={`mt-3 text-[2.6rem] font-bold leading-none tracking-tight ${wordmarkClass}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          foodie
        </span>
      )}
    </div>
  );
}
