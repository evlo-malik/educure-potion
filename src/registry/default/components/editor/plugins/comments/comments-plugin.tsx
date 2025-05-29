'use client';

import { AfterEditableComments } from '@/registry/default/potion-ui/floating-discussion';

import { ExtendedCommentsPlugin } from './ExtendedCommentsPlugin';

export const commentsPlugin = ExtendedCommentsPlugin.extend({
  render: {
    afterEditable: AfterEditableComments as any,
  },
});
