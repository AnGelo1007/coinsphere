import type { SVGProps } from 'react';
export const BtcIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M15.5 15.5a3.5 3.5 0 000-7h-5.023" />
    <path d="M10.477 15.5V8.5" />
    <path d="M13.5 12.5H8" />
    <path d="M13.5 12.5a1 1 0 100-2 1 1 0 000 2z" />
    <path d="M10.477 8.5a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);
