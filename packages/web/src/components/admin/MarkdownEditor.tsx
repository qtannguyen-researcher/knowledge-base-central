'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  placeholder?: string;
  minHeight?: string;
  autoSaveInterval?: number;
  disabled?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = 'Write your content here using Markdown...',
  minHeight = '400px',
  autoSaveInterval = 30000,
  disabled = false,
}: MarkdownEditorProps) {
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangesRef = useRef(false);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
      hasChangesRef.current = true;
      setIsSaved(false);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      if (onSave) {
        autoSaveTimerRef.current = setTimeout(async () => {
          if (hasChangesRef.current) {
            setIsSaving(true);
            try {
              await onSave(val);
              setIsSaved(true);
              setLastSaved(new Date());
              hasChangesRef.current = false;
            } catch (error) {
              console.error('Auto-save failed:', error);
            } finally {
              setIsSaving(false);
            }
          }
        }, autoSaveInterval);
      }
    },
    [onChange, onSave, autoSaveInterval],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isSaved]);

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = editorRef.current?.querySelector('.cm-content') as HTMLElement;
    if (!textarea) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString() || placeholder;

    const event = new CustomEvent('cm-insert', {
      detail: { before, after, selectedText },
    });
    textarea.dispatchEvent(event);
  }, []);

  const toolbarButtons = [
    {
      label: 'B',
      title: 'Bold',
      action: () => insertText('**', '**', 'bold text'),
      className: 'font-bold',
    },
    {
      label: 'I',
      title: 'Italic',
      action: () => insertText('*', '*', 'italic text'),
      className: 'italic',
    },
    {
      label: 'H1',
      title: 'Heading 1',
      action: () => insertText('# ', '', 'Heading'),
      className: 'font-bold',
    },
    {
      label: 'H2',
      title: 'Heading 2',
      action: () => insertText('## ', '', 'Heading'),
      className: 'font-bold',
    },
    {
      label: 'H3',
      title: 'Heading 3',
      action: () => insertText('### ', '', 'Heading'),
      className: 'font-bold',
    },
    { label: '⟨⟩', title: 'Code', action: () => insertText('`', '`', 'code'), className: '' },
    {
      label: '```',
      title: 'Code Block',
      action: () => insertText('```\n', '\n```', 'code'),
      className: '',
    },
    {
      label: '🔗',
      title: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
      className: '',
    },
    {
      label: '📷',
      title: 'Image',
      action: () => insertText('![', '](url)', 'alt text'),
      className: '',
    },
    {
      label: '📋',
      title: 'Table',
      action: () =>
        insertText('\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n', '', ''),
      className: '',
    },
    { label: '•', title: 'List', action: () => insertText('- ', '', 'list item'), className: '' },
    {
      label: '1.',
      title: 'Numbered List',
      action: () => insertText('1. ', '', 'list item'),
      className: '',
    },
    { label: '☑', title: 'Task', action: () => insertText('- [ ] ', '', 'task'), className: '' },
    { label: '❝', title: 'Quote', action: () => insertText('> ', '', 'quote'), className: '' },
    {
      label: '---',
      title: 'Horizontal Rule',
      action: () => insertText('\n---\n', '', ''),
      className: '',
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={btn.action}
            disabled={disabled}
            title={btn.title}
            className={`rounded px-2 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs">
          {isSaving && <span className="text-gray-500">Saving...</span>}
          {!isSaving && isSaved && lastSaved && (
            <span className="text-gray-500">Saved {lastSaved.toLocaleTimeString()}</span>
          )}
          {!isSaving && !isSaved && <span className="text-amber-600">Unsaved changes</span>}
        </div>
      </div>
      <div className="grid grid-cols-2" style={{ minHeight }}>
        <div ref={editorRef} className="border-r border-gray-200">
          <CodeMirror
            value={value}
            onChange={handleChange}
            extensions={[
              markdown({ base: markdownLanguage, codeLanguages: languages }),
              EditorView.lineWrapping,
            ]}
            theme="light"
            placeholder={placeholder}
            editable={!disabled}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
            }}
            style={{ height: '100%', minHeight }}
          />
        </div>
        <div className="overflow-auto p-4" style={{ minHeight }}>
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
            >
              {value || '*Preview will appear here...*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
