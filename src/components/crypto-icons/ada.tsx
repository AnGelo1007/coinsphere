import type { SVGProps } from 'react';
export const AdaIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M10 12a2 2 0 10-4 0v4" />
    <path d="M14 12a2 2 0 104 0v4" />
    <path d="M6 12h12" />
    <path d="M10 8h4" />
  </svg>
);
