import * as React from 'react';

import type { TEquationElement } from '@udecode/plate-math';

import { type SlateElementProps, SlateElement } from '@udecode/plate';
import { getEquationHtml } from '@udecode/plate-math';

import { cn } from '@/lib/utils';

export function EquationElementStatic(
  props: SlateElementProps<TEquationElement>
) {
  const element = props.element;

  const html = getEquationHtml({
    element,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <SlateElement className="my-1" {...props}>
      <div
        className={cn(
          'flex items-center justify-center rounded-sm select-none',
          element.texExpression.length === 0 ? 'bg-muted p-3' : 'px-2 py-1'
        )}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
