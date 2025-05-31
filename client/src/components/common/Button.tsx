import React, { ElementType, ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

// 커스텀 prop 분리
interface CustomButtonProps {
  variant?: 'primary' | 'outline'
  isLoading?: boolean
  as?: ElementType
  children: ReactNode
  className?: string
  disabled?: boolean
}

type AnchorButtonProps = CustomButtonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }
type NativeButtonProps = CustomButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' | undefined }
type ButtonProps = AnchorButtonProps | NativeButtonProps

export function Button(props: ButtonProps) {
  const {
    as = 'button',
    children,
    variant = 'primary',
    isLoading = false,
    className = '',
    disabled,
    ...rest
  } = props as any
  const Component = as
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantStyles = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-orange-400'
  }
  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${isLoading ? 'animate-spin' : ''}`}
      disabled={Component === 'button' ? (disabled || isLoading) : undefined}
      aria-disabled={Component !== 'button' ? (disabled || isLoading) : undefined}
      {...rest}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        children
      )}
    </Component>
  )
} 