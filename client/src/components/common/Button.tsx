import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'outline'
  isLoading?: boolean
}

const variantStyles = {
  primary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
  success: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500',
  outline: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-orange-500'
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center px-4 py-2
        text-sm font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
} 