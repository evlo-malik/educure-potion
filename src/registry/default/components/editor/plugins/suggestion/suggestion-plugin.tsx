'use client';

import { BlockSuggestion } from '@/registry/default/potion-ui/block-suggestion';
import { SuggestionBelowNodes } from '@/registry/default/potion-ui/suggestion-line-break';

import { ExtendedSuggestionPlugin } from './ExtendedSuggestionPlugin';

export const suggestionPlugin = ExtendedSuggestionPlugin.extend({
  render: {
    belowNodes: SuggestionBelowNodes as any,
    belowRootNodes: ({ api, element }) => {
      if (!api.suggestion!.isBlockSuggestion(element)) {
        return null;
      }

      return <BlockSuggestion element={element} />;
    },
  },
});
