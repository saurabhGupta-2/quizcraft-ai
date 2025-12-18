import React from 'react';

/**
 * A container component styled as a card with optional hover effects.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the card.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the card.
 * @param {boolean} [props.hover=false] - If true, adds a hover effect to the card.
 */
export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${
        hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
