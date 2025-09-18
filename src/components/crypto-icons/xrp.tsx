import type { SVGProps } from 'react';
export const XrpIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M5 12l5-5" />
    <path d="M19 12l-5-5" />
    <path d="M5 12l5 5" />
    <path d="M19 12l-5 5" />
  </svg>
);
