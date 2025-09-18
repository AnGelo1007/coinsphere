import type { SVGProps } from 'react';
export const DogeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M10 14s-1-2-4-2" />
    <path d="M15.5 12c-3 0-4.5 3-4.5 3s1-2 4-2" />
    <path d="M12 12v3" />
  </svg>
);
