import type { SVGProps } from 'react';
export const MaticIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2L2 8l10 6 10-6z" />
    <path d="M2 16l10 6 10-6" />
    <path d="M2 8l10 6 10-6" />
  </svg>
);
