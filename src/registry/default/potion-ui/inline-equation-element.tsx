'use client';

import * as React from 'react';

import type { TEquationElement } from '@udecode/plate-math';

import { useEquationElement } from '@udecode/plate-math/react';
import {
  type PlateElementProps,
  PlateElement,
  useElement,
} from '@udecode/plate/react';
import { RadicalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { EquationPopoverContent } from './equation-popover';
import { Popover, PopoverTrigger } from './popover';

export function InlineEquationElement(props: PlateElementProps) {
  const element = useElement<TEquationElement>();
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  useEquationElement({
    element,
    katexRef: katexRef,
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
    <PlateElement
      className="inline-block rounded-sm select-none [&_.katex-display]:my-0"
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'after:absolute after:inset-0 after:-top-0.5 after:-left-1 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
              'h-6',
              element.texExpression.length > 0 && open && 'after:bg-brand/15',
              element.texExpression.length === 0 &&
                'text-muted-foreground after:bg-neutral-500/10'
            )}
            contentEditable={false}
          >
            <span
              ref={katexRef}
              className={cn(
                element.texExpression.length === 0 && 'hidden',
                'font-mono leading-none'
              )}
            />
            {element.texExpression.length === 0 && (
              <span>
                <RadicalIcon className="mr-1 inline-block h-[19px] w-4 py-[1.5px] align-text-bottom" />
                New equation
              </span>
            )}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          variant="equationInline"
          className="my-auto"
          open={open}
          placeholder="E = mc^2"
          isInline={true}
          setOpen={setOpen}
        />
      </Popover>

      {props.children}
    </PlateElement>
  );
}
