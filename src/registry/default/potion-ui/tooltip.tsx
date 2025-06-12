'use client';

import * as React from 'react';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';
import { useMounted } from '@/registry/default/hooks/use-mounted';

export function TooltipProvider({
  delayDuration = 200,
  disableHoverableContent = true,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipPortal = TooltipPrimitive.Portal;

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      className={cn(
        'z-9999 overflow-hidden rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground shadow-md',
        className
      )}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export function TooltipTC({
  children,
  className,
  content,
  defaultOpen,
  delayDuration,
  disableHoverableContent,
  open,
  onOpenChange,
  ...props
}: {
  content: React.ReactNode;
} & React.ComponentProps<typeof TooltipPrimitive.Content> &
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  const mounted = useMounted();

  if (!mounted) {
    return children;
  }

  return (
    <TooltipProvider>
      <Tooltip
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>

        <TooltipPortal>
          <TooltipContent className={className} {...props}>
            {content}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}

type TooltipProps<T extends React.ElementType> = {
  shortcut?: React.ReactNode;
  tooltip?: React.ReactNode;
  tooltipContentProps?: Omit<
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    "children"
  >;
  tooltipProps?: Omit<
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>,
    "children"
  >;
  tooltipTriggerProps?: React.ComponentPropsWithoutRef<
    typeof TooltipPrimitive.Trigger
  >;
} & React.ComponentPropsWithoutRef<T>;

export function withTooltip<
  T extends React.ComponentType<any> | keyof React.JSX.IntrinsicElements
>(Component: T) {
  type Props = TooltipProps<T>;

  const WrappedComponent = React.forwardRef<any, Props>((props, ref) => {
    const {
      shortcut,
      tooltip,
      tooltipContentProps,
      tooltipProps,
      tooltipTriggerProps,
      ...restProps
    } = props;

    const isMounted = useMounted();

    // Type assert Component as any for JSX usage
    const ComponentToRender = Component as any;
    const component = <ComponentToRender ref={ref} {...(restProps as any)} />;

    if (tooltip && isMounted) {
      return (
        <TooltipPrimitive.Provider>
          <TooltipPrimitive.Root {...tooltipProps}>
            <TooltipPrimitive.Trigger asChild {...tooltipTriggerProps}>
              {component}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content {...tooltipContentProps}>
                {tooltip}
                {shortcut && (
                  <div className="mt-px text-gray-400">{shortcut}</div>
                )}
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      );
    }

    return component;
  });
  const getDisplayName = (comp: any): string => {
    if (typeof comp === "string") return comp;
    return comp?.displayName || comp?.name || "Component";
  };

  WrappedComponent.displayName = `WithTooltip(${getDisplayName(Component)})`;

  return WrappedComponent;
}