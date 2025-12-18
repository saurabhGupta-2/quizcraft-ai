import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A customizable button component with different variants, sizes, and a loading state.
 * Can be rendered as a different element using the 'as' prop.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {React.ElementType} [props.as] - The HTML element to render the component as (e.g., 'span', 'a'). Defaults to 'button'.
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary'] - The button's visual style.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The button's size.
 * @param {boolean} [props.loading=false] - If true, shows a loading spinner and disables the button.
 * @param {React.ReactNode} [props.icon] - An optional icon to display before the button's text.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the button.
 * @param {boolean} [props.disabled] - If true, disables the button.
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} [props...rest] - Other native button attributes.
 */
export function Button({
  children,
  as,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) {
  // --- THIS IS THE FIX ---
  // If 'as' prop is provided, use it (e.g., 'span'). Otherwise, default to 'button'.
  const Tag = as || 'button';
  // ---------------------

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-purple-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    // We now use 'Tag' instead of 'button'
    <Tag
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </Tag>
  );
}

