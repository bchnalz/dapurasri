import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border-2 border-primary/30 bg-card hover:bg-accent hover:border-primary/50 hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const buttonSizes = {
  default: 'h-9 px-3 py-1.5',
  sm: 'h-8 rounded-md px-2.5',
  lg: 'h-10 rounded-md px-5',
  icon: 'h-9 w-9',
}

export function getButtonClass({ variant = 'default', size = 'default' } = {}) {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    buttonVariants[variant] ?? buttonVariants.default,
    buttonSizes[size] ?? buttonSizes.default
  )
}

export const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants[variant] ?? buttonVariants.default,
          buttonSizes[size] ?? buttonSizes.default,
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
