'use client';

import * as React from 'react';

import type { TLinkElement } from '@udecode/plate-link';

import { useLink } from '@udecode/plate-link/react';
import {
  type PlateElementProps,
  PlateElement,
  useElement,
} from '@udecode/plate/react';

export function LinkElement(props: PlateElementProps) {
  const element = useElement<TLinkElement>();
  const { props: linkProps } = useLink({ element });

  return (
    <PlateElement
      {...props}
      as="a"
      className="font-medium text-primary underline decoration-primary underline-offset-4"
      attributes={{
        ...props.attributes,
        ...(linkProps as any),
      }}
    >
      {props.children}
    </PlateElement>
  );
}
