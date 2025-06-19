import React from 'react';

// This is a custom SVG component that matches the logo in your screenshot.
export const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C13.1046 2 14 2.89543 14 4V6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6V4C10 2.89543 10.8954 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12 16C13.1046 16 14 16.8954 14 18V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V18C10 16.8954 10.8954 16 12 16Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 8H4C2.89543 8 2 8.89543 2 10V14C2 15.1046 2.89543 16 4 16H8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 8H20C21.1046 8 22 8.89543 22 10V14C22 15.1046 21.1046 16 20 16H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);