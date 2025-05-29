'use client';

import * as React from 'react';

import { type PlateElementProps, PlateElement } from '@udecode/plate/react';
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

export function HeadingElement({
  children,
  variant = 'h1',
  ...props
}: PlateElementProps & {
  variant?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <PlateElement
      as={variant}
      className={headingVariants({ variant })}
      {...props}
    >
      {children}
    </PlateElement>
  );
}
