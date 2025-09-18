import type { SVGProps } from 'react';
export const SolIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M4 18h16" />
    <path d="M4 12h16" />
    <path d="M4 6h16" />
  </svg>
);
