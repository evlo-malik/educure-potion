'use client';

import type { TComment } from '@/registry/default/potion-ui/comment';

import { createPlatePlugin } from '@udecode/plate/react';

import { BlockDiscussion } from '@/registry/default/potion-ui/block-discussion';

export interface TDiscussion {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
}

const discussionsData: TDiscussion[] = [
  {
    id: 'discussion1',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'This is a comment',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 900_000),
        discussionId: 'discussion1',
        isEdited: false,
        userId: 'alice',
      },
    ],
    createdAt: new Date(),
    documentContent: 'comments',
    isResolved: false,
    userId: 'alice',
  },
  {
    id: 'discussion2',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'There will be animation here',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 900_000),
        discussionId: 'discussion1',
        isEdited: false,
        userId: 'bob',
      },
    ],
    createdAt: new Date(),
    documentContent: 'here',
    isResolved: false,
    userId: 'bob',
  },
  {
    id: 'discussion3',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'Try hovering here',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 900_000),
        discussionId: 'discussion3',
        isEdited: false,
        userId: 'charlie',
      },
    ],
    createdAt: new Date(),
    documentContent: 'activate',
    isResolved: false,
    userId: 'charlie',
  },
  {
    id: 'discussion4',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'Click here to highlight this block',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 900_000),
        discussionId: 'discussion4',
        isEdited: false,
        userId: 'alice',
      },
    ],
    createdAt: new Date(),
    documentContent: 'block',
    isResolved: false,
    userId: 'bob',
  },
];

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

const usersData: Record<
  string,
  { id: string; avatarUrl: string; name: string; hue?: number }
> = {
  alice: {
    id: 'alice',
    avatarUrl: avatarUrl('alice6'),
    name: 'Alice',
  },
  bob: {
    id: 'bob',
    avatarUrl: avatarUrl('bob4'),
    name: 'Bob',
  },
  charlie: {
    id: 'charlie',
    avatarUrl: avatarUrl('charlie2'),
    name: 'Charlie',
  },
};

// This plugin is purely UI. It's only used to store the discussions and users data
export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUserId: 'alice',
    discussions: discussionsData,
    users: usersData,
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => getOption('users')[getOption('currentUserId')],
    user: (id: string) => getOption('users')[id],
  }));
