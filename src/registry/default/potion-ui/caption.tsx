import * as React from 'react';

import { createPrimitiveComponent } from '@udecode/cn';
import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from '@udecode/plate-caption/react';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Button } from './button';

const captionVariants = cva('max-w-full', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

type CaptionProps = React.ComponentPropsWithoutRef<typeof CaptionPrimitive> &
  VariantProps<typeof captionVariants>;

export function Caption({ align, className, ...props }: CaptionProps) {
  return (
    <CaptionPrimitive
      {...props}
      className={cn(captionVariants({ align }), className)}
    />
  );
}

export function CaptionTextarea(
  props: React.ComponentPropsWithoutRef<typeof CaptionTextareaPrimitive>
) {
  return (
    <CaptionTextareaPrimitive
      {...props}
      className={cn(
        'mt-2 w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
        'focus:outline-hidden focus:[&::placeholder]:opacity-0',
        'text-center print:placeholder:text-transparent'
      )}
    />
  );
}

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
});
