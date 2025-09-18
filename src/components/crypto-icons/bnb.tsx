import type { SVGProps } from 'react';
export const BnbIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2l4 4-4 4-4-4z" />
    <path d="M2 12l4 4-4 4-4-4z" />
    <path d="M22 12l-4 4-4-4 4-4z" />
    <path d="M12 22l-4-4 4-4 4 4z" />
    <path d="M14.5 9.5l-5 5" />
    <path d="M9.5 14.5l-3-3" />
    <path d="M17.5 6.5l-3-3" />
  </svg>
);
