'use client';

import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

type ToolbarButtonProps = {
  icon: string;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
};

const DEFAULT_FONT_SIZE_PX = '14';
const MIN_FONT_SIZE_PX = 10;
const MAX_FONT_SIZE_PX = 72;

const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }

          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

function readFontSizePx(editor: Editor): string {
  const rawValue = editor.getAttributes('textStyle').fontSize;
  if (typeof rawValue !== 'string') {
    return DEFAULT_FONT_SIZE_PX;
  }

  const parsed = Number.parseInt(rawValue.replace('px', ''), 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_FONT_SIZE_PX;
  }

  return String(Math.min(MAX_FONT_SIZE_PX, Math.max(MIN_FONT_SIZE_PX, parsed)));
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
        isActive
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-outline-variant bg-white text-on-surface-variant hover:bg-slate-50'
      } disabled:cursor-not-allowed disabled:opacity-40`}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <span className='material-symbols-outlined text-[18px]'>{icon}</span>
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Ürün detaylarını buraya yazınız...',
  disabled = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [fontSizeInput, setFontSizeInput] = useState(DEFAULT_FONT_SIZE_PX);
  const [, setToolbarVersion] = useState(0);

  const syncToolbarState = (currentEditor: Editor): void => {
    const nextFontSize = readFontSizePx(currentEditor);
    setFontSizeInput((current) => (current === nextFontSize ? current : nextFontSize));
    setToolbarVersion((current) => current + 1);
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit,
      Underline,
      TextStyleWithFontSize,
      Color,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap min-h-[180px] max-h-[380px] overflow-y-auto p-3 text-sm text-on-surface outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    onCreate: ({ editor: currentEditor }) => {
      syncToolbarState(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      syncToolbarState(currentEditor);
    },
    onTransaction: ({ editor: currentEditor }) => {
      syncToolbarState(currentEditor);
    },
    onFocus: ({ editor: currentEditor }) => {
      setIsFocused(true);
      syncToolbarState(currentEditor);
    },
    onBlur: () => {
      setIsFocused(false);
      setToolbarVersion((current) => current + 1);
    },
  });

  const applyFontSize = (): void => {
    if (!editor || disabled) {
      return;
    }

    const parsed = Number.parseInt(fontSizeInput, 10);
    if (Number.isNaN(parsed)) {
      setFontSizeInput(readFontSizePx(editor));
      return;
    }

    const bounded = Math.min(MAX_FONT_SIZE_PX, Math.max(MIN_FONT_SIZE_PX, parsed));
    editor
      .chain()
      .focus()
      .setMark('textStyle', { fontSize: `${bounded}px` })
      .run();
    setFontSizeInput(String(bounded));
    setToolbarVersion((current) => current + 1);
  };

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className='rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant'>
        Editör yükleniyor...
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface-container-low transition-all ${
        isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'
      }`}
    >
      <div className='flex flex-wrap items-center gap-2 border-b border-outline-variant/70 bg-surface px-3 py-2'>
        <ToolbarButton
          icon='format_bold'
          label='Kalın'
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_italic'
          label='İtalik'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_underlined'
          label='Altı Çizili'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_strikethrough'
          label='Üstü Çizili'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          disabled={disabled}
        />

        <div className='mx-1 h-6 w-px bg-outline-variant/70' />

        <ToolbarButton
          icon='title'
          label='Başlık'
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_list_bulleted'
          label='Madde Listesi'
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_list_numbered'
          label='Numaralı Liste'
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          disabled={disabled}
        />

        <div className='mx-1 h-6 w-px bg-outline-variant/70' />

        <ToolbarButton
          icon='format_align_left'
          label='Sola Hizala'
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_align_center'
          label='Ortala'
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          disabled={disabled}
        />
        <ToolbarButton
          icon='format_align_right'
          label='Sağa Hizala'
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          disabled={disabled}
        />

        <div className='mx-1 h-6 w-px bg-outline-variant/70' />

        <ToolbarButton
          icon='ink_highlighter'
          label='Vurgula'
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          disabled={disabled}
        />

        <div className='inline-flex items-center gap-1 rounded-md border border-outline-variant bg-white px-2 py-1'>
          <span className='text-[11px] font-semibold text-on-surface-variant'>Punto</span>
          <input
            type='number'
            min={MIN_FONT_SIZE_PX}
            max={MAX_FONT_SIZE_PX}
            value={fontSizeInput}
            disabled={disabled}
            className='h-7 w-14 rounded border border-outline-variant bg-white px-1 text-center text-xs text-on-surface outline-none transition-colors focus:border-primary'
            onChange={(event) => {
              setFontSizeInput(event.target.value);
            }}
            onBlur={applyFontSize}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyFontSize();
              }
            }}
          />
        </div>

        <label
          className='relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-white text-on-surface-variant transition-colors hover:bg-slate-50'
          title='Metin Rengi'
          aria-label='Metin Rengi'
        >
          <span className='text-sm font-semibold leading-none'>A</span>
          <span className='absolute bottom-[8px] h-[2px] w-4 rounded-full bg-on-surface-variant' />
          <input
            type='color'
            className='absolute inset-0 cursor-pointer opacity-0'
            disabled={disabled}
            onChange={(event) => {
              editor.chain().focus().setColor(event.target.value).run();
              setToolbarVersion((current) => current + 1);
            }}
          />
        </label>

        <div className='mx-1 h-6 w-px bg-outline-variant/70' />

        <ToolbarButton
          icon='undo'
          label='Geri Al'
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().chain().focus().undo().run()}
        />
        <ToolbarButton
          icon='redo'
          label='İleri Al'
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} className='bg-white' />

      <style jsx global>{`
        .tiptap p {
          margin: 0.5rem 0;
          line-height: 1.55;
        }

        .tiptap h1,
        .tiptap h2,
        .tiptap h3 {
          margin: 0.75rem 0 0.4rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .tiptap h1 {
          font-size: 1.25rem;
        }

        .tiptap h2 {
          font-size: 1.125rem;
        }

        .tiptap h3 {
          font-size: 1rem;
        }

        .tiptap ul,
        .tiptap ol {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }

        .tiptap ul {
          list-style-type: disc;
        }

        .tiptap ol {
          list-style-type: decimal;
        }

        .tiptap ul ul {
          list-style-type: circle;
        }

        .tiptap ul ul ul {
          list-style-type: square;
        }

        .tiptap li {
          margin: 0.2rem 0;
        }

        .tiptap li p {
          margin: 0;
        }

        .tiptap blockquote {
          border-left: 3px solid rgba(100, 116, 139, 0.45);
          margin: 0.75rem 0;
          padding-left: 0.75rem;
          color: rgb(71, 85, 105);
        }

        .tiptap .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(100, 116, 139, 0.9);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
