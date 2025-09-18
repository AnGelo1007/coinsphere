import type { SVGProps } from 'react';
export const EthIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2l7 10-7 10-7-10z" />
    <path d="M12 2v20" />
    <path d="M19 12H5" />
  </svg>
);
