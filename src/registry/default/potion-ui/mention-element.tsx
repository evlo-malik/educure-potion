'use client';

import * as React from 'react';

import type { TMentionElement } from '@udecode/plate-mention';

import { IS_APPLE } from '@udecode/plate';
import {
  type PlateElementProps,
  PlateElement,
  useElement,
  useFocused,
  useSelected,
} from '@udecode/plate/react';

import { cn } from '@/lib/utils';
import { useMounted } from '@/registry/default/hooks/use-mounted';

export function MentionElement({
  prefix,
  ...props
}: PlateElementProps & {
  prefix?: string;
}) {
  const { children } = props;
  const element = useElement<TMentionElement>();
  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block cursor-pointer rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium',
        selected && focused && 'ring-2 ring-ring',
        element.children[0].bold === true && 'font-bold',
        element.children[0].italic === true && 'italic',
        element.children[0].underline === true && 'underline'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        <React.Fragment>
          {children}
          {prefix}
          {element.value}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {prefix}
          {element.value}
          {children}
        </React.Fragment>
      )}
    </PlateElement>
  );
}
