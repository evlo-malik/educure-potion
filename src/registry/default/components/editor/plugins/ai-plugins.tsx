'use client';

import React, { useEffect } from 'react';

import type { AIChatPluginConfig } from '@udecode/plate-ai/react';

import { PathApi } from '@udecode/plate';
import { streamInsertChunk, withAIBatch } from '@udecode/plate-ai';
import { AIChatPlugin, AIPlugin, useChatChunk } from '@udecode/plate-ai/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { usePluginOption } from '@udecode/plate/react';
import { useStickToBottom } from 'use-stick-to-bottom';

import { AIMenu } from '@/registry/default/potion-ui/ai-menu';

import { cursorOverlayPlugin } from './cursor-overlay-plugin';
import { markdownPlugin } from './markdown-plugin';

const systemCommon = `\
You are an advanced AI-powered note-taking assistant, designed to enhance productivity and creativity in note management.
Respond directly to user prompts with clear, concise, and relevant content. Maintain a neutral, helpful tone.

Rules:
- <Document> is the entire note the user is working on.
- <Reminder> is a reminder of how you should reply to INSTRUCTIONS. It does not apply to questions.
- Anything else is the user prompt.
- Your response should be tailored to the user's prompt, providing precise assistance to optimize note management.
- For INSTRUCTIONS: Follow the <Reminder> exactly. Provide ONLY the content to be inserted or replaced. No explanations or comments.
- For QUESTIONS: Provide a helpful and concise answer. You may include brief explanations if necessary.
- CRITICAL: Distinguish between INSTRUCTIONS and QUESTIONS. Instructions typically ask you to modify or add content. Questions ask for information or clarification.
`;

const systemDefault = `\
${systemCommon}
- <Block> is the current block of text the user is working on.
- Ensure your output can seamlessly fit into the existing <Block> structure.

<Block>
{block}
</Block>
`;

const systemSelecting = `\
${systemCommon}
- <Block> is the block of text containing the user's selection, providing context.
- Ensure your output can seamlessly fit into the existing <Block> structure.
- <Selection> is the specific text the user has selected in the block and wants to modify or ask about.
- Consider the context provided by <Block>, but only modify <Selection>. Your response should be a direct replacement for <Selection>.
<Block>
{block}
</Block>
<Selection>
{selection}
</Selection>
`;

const systemBlockSelecting = `\
${systemCommon}
- <Selection> represents the full blocks of text the user has selected and wants to modify or ask about.
- Your response should be a direct replacement for the entire <Selection>.
- Maintain the overall structure and formatting of the selected blocks, unless explicitly instructed otherwise.
- CRITICAL: Provide only the content to replace <Selection>. Do not add additional blocks or change the block structure unless specifically requested.
<Selection>
{block}
</Selection>
`;

const userDefault = `<Reminder>
CRITICAL: NEVER write <Block>.
</Reminder>
{prompt}`;

const userSelecting = `<Reminder>
If this is a question, provide a helpful and concise answer about <Selection>.
If this is an instruction, provide ONLY the text to replace <Selection>. No explanations.
Ensure it fits seamlessly within <Block>. If <Block> is empty, write ONE random sentence.
NEVER write <Block> or <Selection>.
</Reminder>
{prompt} about <Selection>`;

const userBlockSelecting = `<Reminder>
If this is a question, provide a helpful and concise answer about <Selection>.
If this is an instruction, provide ONLY the content to replace the entire <Selection>. No explanations.
Maintain the overall structure unless instructed otherwise.
NEVER write <Block> or <Selection>.
</Reminder>
{prompt} about <Selection>`;

export const PROMPT_TEMPLATES = {
  systemBlockSelecting,
  systemDefault,
  systemSelecting,
  userBlockSelecting,
  userDefault,
  userSelecting,
};

export const aiPlugins = [
  HeadingPlugin.configure({ options: { levels: 3 } }),
  cursorOverlayPlugin,
  markdownPlugin,
  AIPlugin,
  AIChatPlugin.configure({
    options: {
      promptTemplate: ({ isBlockSelecting, isSelecting }) => {
        return isBlockSelecting
          ? PROMPT_TEMPLATES.userBlockSelecting
          : isSelecting
            ? PROMPT_TEMPLATES.userSelecting
            : PROMPT_TEMPLATES.userDefault;
      },
      systemTemplate: ({ isBlockSelecting, isSelecting }) => {
        return isBlockSelecting
          ? PROMPT_TEMPLATES.systemBlockSelecting
          : isSelecting
            ? PROMPT_TEMPLATES.systemSelecting
            : PROMPT_TEMPLATES.systemDefault;
      },
    },
    render: {
      afterEditable: () => <AIMenu />,
    },
  })
    .extend({
      options: {
        contentRef: null as
          | (React.RefObject<HTMLElement | null> &
              React.RefCallback<HTMLElement>)
          | null,
        scrollRef: null as
          | (React.RefObject<HTMLElement | null> &
              React.RefCallback<HTMLElement>)
          | null,
      },
    })
    .extend({
      useHooks: ({ api, editor, getOption, setOptions }) => {
        const { contentRef, escapedFromLock, scrollRef, scrollToBottom } =
          useStickToBottom({
            /** Replace "bottom of the scroll container" with "top of the anchor" */
            targetScrollTop: (_defaultBottom, { scrollElement }) => {
              const anchorNode = api.aiChat.node({ anchor: true });

              if (!anchorNode) return 0; // fallback: real bottom

              const anchor = api.toDOMNode(anchorNode[0])?.parentElement
                ?.parentElement as HTMLDivElement;

              if (!anchor) return 0; // fallback: real bottom

              const scrollRect = scrollElement.getBoundingClientRect();
              const anchorRect = anchor.getBoundingClientRect();

              // Add a threshold of 100px from the bottom
              const threshold = 100;
              const isVisible =
                anchorRect.top >= scrollRect.top &&
                anchorRect.bottom <= scrollRect.bottom - threshold;

              const anchorTop = anchor.offsetTop - scrollElement.offsetTop;

              return isVisible ? 0 : anchorTop;
            },
          });

        useEffect(() => {
          setOptions({ contentRef, scrollRef });
        }, [contentRef, scrollRef, setOptions]);

        const mode = usePluginOption(
          { key: 'aiChat' } as AIChatPluginConfig,
          'mode'
        );

        useChatChunk({
          onChunk: ({ chunk, isFirst, nodes }) => {
            if (isFirst && mode == 'insert') {
              editor.tf.withoutSaving(() => {
                editor.tf.insertNodes(
                  {
                    children: [{ text: '' }],
                    type: AIChatPlugin.key,
                  },
                  {
                    at: PathApi.next(editor.selection!.focus.path.slice(0, 1)),
                  }
                );
              });
              editor.setOption(AIChatPlugin, 'streaming', true);
            }
            if (mode === 'insert' && nodes.length > 0) {
              withAIBatch(
                editor,
                () => {
                  if (!getOption('streaming')) return;

                  streamInsertChunk(editor, chunk, {
                    textProps: {
                      ai: true,
                    },
                  });

                  if (!escapedFromLock) {
                    void scrollToBottom('smooth');
                  }
                },
                { split: isFirst }
              );
            }
          },
          onFinish: () => {
            editor.setOption(AIChatPlugin, 'streaming', false);
            editor.setOption(AIChatPlugin, '_blockChunks', '');
            editor.setOption(AIChatPlugin, '_blockPath', null);
            editor.setOption(AIChatPlugin, 'experimental_lastTextId', null);
          },
        });
      },
    }),
] as const;
