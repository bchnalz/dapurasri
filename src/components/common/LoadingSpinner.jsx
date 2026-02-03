import { cn } from '@/lib/utils'

export function LoadingSpinner({ className, ...props }) {
  return (
    <div
      className={cn('h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary', className)}
      role="status"
      aria-label="Memuat"
      {...props}
    />
  )
}
