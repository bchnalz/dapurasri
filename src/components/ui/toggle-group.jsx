import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const ToggleGroupContext = React.createContext({
  variant: 'default',
  size: 'default',
})

const toggleGroupVariants = cva('inline-flex items-center', {
  variants: {
    spacing: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
    },
  },
  defaultVariants: {
    spacing: 1,
  },
})

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:bg-accent/60 hover:text-foreground',
        outline: 'border border-input bg-background hover:bg-accent/60 hover:text-foreground',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-8 px-2.5',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const ToggleGroup = React.forwardRef(
  ({ className, spacing, variant = 'default', size = 'default', children, ...props }, ref) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(toggleGroupVariants({ spacing }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
)
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleGroupItemVariants({
            variant: variant ?? context.variant,
            size: size ?? context.size,
          }),
          className
        )}
        {...props}
      />
    )
  }
)
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
