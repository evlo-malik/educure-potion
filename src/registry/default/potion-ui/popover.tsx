'use client';

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const popoverVariants = cva(
  cn(
    "group/popover",
    "z-50 max-w-[calc(100vw-24px)] animate-popover overflow-hidden rounded-md bg-popover text-popover-foreground shadow-floating outline-hidden"
  ),
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        combobox: "",
        default: "w-72",
        equation: "w-[400px] rounded-lg px-2.5 py-2",
        equationInline: "w-[400px] rounded-lg px-2.5 py-2",
        media: "max-h-[70vh] min-w-[180px] rounded-lg",
      },
    },
  }
);

// ✅ FIXED: Removed `ref` from Root (it doesn't accept one)
const Popover = React.forwardRef<
  never,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>
>((props, _ref) => {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
});
Popover.displayName = "Popover";

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => {
  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      data-slot="popover-trigger"
      {...props}
    />
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverVariants>
>(({ align = "center", className, sideOffset = 4, variant, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        className={cn(popoverVariants({ variant }), className)}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = "PopoverContent";

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  popoverVariants,
};
