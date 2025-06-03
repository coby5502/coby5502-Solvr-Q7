import { ElementType, ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

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

const variantStyles: Record<string, string> = {
  primary: 'bg-orange-500 text-white hover:bg-orange-600',
  outline: 'border border-orange-500 text-orange-500 hover:bg-orange-50'
}

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