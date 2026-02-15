import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl bg-card text-card-foreground shadow-md', className)}
    {...props}
  />
))
Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1 px-3 pt-2', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-sm font-medium text-muted-foreground', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-3 pb-2', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center px-3 pb-2', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'
