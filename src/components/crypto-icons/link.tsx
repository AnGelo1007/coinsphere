import type { SVGProps } from 'react';
export const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M9 12h6" />
    <path d="M15 9l-3 6" />
    <path d="M9 15l3-6" />
    <circle cx="7" cy="12" r="2" />
    <circle cx="17" cy="12" r="2" />
  </svg>
);
