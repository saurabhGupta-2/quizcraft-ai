import { Loader2 } from 'lucide-react';

/**
 * A loading spinner component with customizable size and a full-screen option.
 *
 * @param {object} props - The component props.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the spinner icon.
 * @param {boolean} [props.fullScreen=false] - If true, the spinner is centered in a full-screen container.
 */
export function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <Loader2 className={`animate-spin text-purple-600 ${sizes[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
