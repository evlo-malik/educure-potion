import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Pencil, Check, X, Download } from 'lucide-react';
import type { Components } from 'react-markdown';

interface EditableNoteProps {
  content: string;
  onSave: (newContent: string) => void;
}

export default function EditableNote({ content, onSave }: EditableNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onSave(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleDownload = () => {
    // Create a styled HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Notes</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              color: #374151;
            }
            h1 {
              font-size: 2rem;
              font-weight: bold;
              background: linear-gradient(to right, #4f46e5, #7c3aed);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              padding-bottom: 1rem;
              margin-bottom: 2rem;
              border-bottom: 2px solid #e5e7eb;
            }
            h2 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1f2937;
              margin-top: 3rem;
              margin-bottom: 1.5rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #f3f4f6;
            }
            h3 {
              font-size: 1.25rem;
              font-weight: 500;
              color: #374151;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            p {
              color: #4b5563;
              margin-bottom: 1.5rem;
              font-size: 1.125rem;
            }
            ul, ol {
              margin: 1.5rem 0;
              padding-left: 1rem;
            }
            li {
              margin: 0.75rem 0;
              color: #4b5563;
            }
            blockquote {
              margin: 2rem 0;
              padding: 1rem 1.5rem;
              border-left: 4px solid #4f46e5;
              background: #f3f4f6;
              border-radius: 0 0.5rem 0.5rem 0;
            }
            blockquote p {
              font-style: italic;
              margin: 0;
            }
            code {
              font-family: ui-monospace, monospace;
              font-size: 0.875rem;
              background: #f3f4f6;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              color: #4f46e5;
            }
            pre {
              background: #1f2937;
              color: #f3f4f6;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1.5rem 0;
            }
            pre code {
              background: transparent;
              color: inherit;
              padding: 0;
            }
            strong {
              font-weight: 600;
              color: #4f46e5;
              background: #eef2ff;
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
            }
            hr {
              margin: 3rem 0;
              border: none;
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            }
          </style>
        </head>
        <body>
          ${document.getElementById('rendered-notes')?.innerHTML || ''}
        </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const markdownComponents: Components = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent pb-4 mb-8 border-b-2 border-indigo-100 dark:border-gray-800">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-12 mb-6 pb-2 border-b border-indigo-50 dark:border-gray-800">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mt-8 mb-4">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="space-y-3 my-6 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-3 my-6 ml-4 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start space-x-3">
        <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 rounded-full mt-2.5 flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-300">{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 pl-6 border-l-4 border-gradient-to-b from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 py-4 px-6 rounded-r-lg">
        <p className="text-gray-700 dark:text-gray-200 italic">{children}</p>
      </blockquote>
    ),
    hr: () => (
      <hr className="my-12 border-none h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-600 to-transparent" />
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">
        {children}
      </strong>
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
          <pre className="relative !mt-0 !mb-0 bg-gradient-to-br from-gray-900 via-[#1e1b4b] to-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm shadow-lg border border-indigo-500/20">
            <code className={className} {...props}>{children}</code>
          </pre>
        </div>
      ) : (
        <code className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="relative">
      <div className="absolute right-0 -top-12 z-50 flex gap-2 bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm">
        <button
          onClick={handleDownload}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition-colors shadow-sm"
          title="Download notes"
        >
          <Download className="w-5 h-5" />
        </button>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-full transition-colors shadow-sm"
              title="Save changes"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-colors shadow-sm"
              title="Cancel editing"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full transition-colors shadow-sm"
            title="Edit notes"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="relative mt-12">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[500px] p-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-y font-mono"
            placeholder="Write your notes in Markdown..."
          />
          <div className="absolute bottom-4 right-4 text-sm text-gray-500 dark:text-gray-400">
            Markdown supported
          </div>
        </div>
      ) : (
        <div id="rendered-notes" className="prose prose-indigo max-w-none mt-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
} 