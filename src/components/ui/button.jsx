import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
  outline: 'border-2 border-primary/30 bg-card hover:bg-accent hover:border-primary/50 hover:text-accent-foreground active:bg-accent/80',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 border border-border',
  ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
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
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,color,border-color,filter,transform,box-shadow] duration-150 active:translate-y-px active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0 disabled:active:brightness-100',
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
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,color,border-color,filter,transform,box-shadow] duration-150 active:translate-y-px active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0 disabled:active:brightness-100',
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
