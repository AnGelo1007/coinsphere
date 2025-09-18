
export function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="12" stroke="url(#logoGradient)" strokeWidth="2.5" />
      <circle cx="14" cy="14" r="6" stroke="url(#logoGradient)" strokeWidth="2.5" />
    </svg>
  );
}
