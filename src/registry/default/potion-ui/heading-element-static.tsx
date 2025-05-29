import * as React from 'react';

import { type SlateElementProps, SlateElement } from '@udecode/plate';
import { cva } from 'class-variance-authority';

const headingVariants = cva(
  'relative mb-1 px-0.5 py-[3px] leading-[1.3]! font-semibold',
  {
    variants: {
      variant: {
        h1: 'mt-8 text-[1.875em]',
        h2: 'mt-[1.4em] text-[1.5em]',
        h3: 'mt-[1em] text-[1.25em]',
      },
    },
  }
);

export function HeadingElementStatic({
  children,
  variant = 'h1',
  ...props
}: SlateElementProps & {
  variant?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <SlateElement
      as={variant}
      className={headingVariants({ variant })}
      {...props}
    >
      {children}
    </SlateElement>
  );
}
