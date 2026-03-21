'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'

interface RichTextEditorProps {
  content?: string
  onChange: (html: string, textLength: number) => void
  placeholder?: string
  maxLength?: number
  variant?: 'full' | 'compact'
  className?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({ onClick, isActive, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive ? 'bg-forest-100 text-forest-800' : 'text-forest-600 hover:bg-sand-200'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-sand-300 mx-1 self-center" />
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Write something...',
  maxLength = 10000,
  variant = 'full',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-earth-500 underline',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      ...(variant === 'full' ? [TextAlign.configure({ types: ['heading', 'paragraph'] })] : []),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const textLength = editor.storage.characterCount.characters()
      onChange(html, textLength)
    },
    editorProps: {
      attributes: {
        class: cn(
          'px-3 py-2 outline-none font-body text-forest-800',
          variant === 'full' ? 'min-h-[150px]' : 'min-h-[80px]',
          // Prose-like styling inside editor
          '[&_h2]:text-lg [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-forest-800 [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-base [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-forest-800 [&_h3]:mt-3 [&_h3]:mb-1',
          '[&_p]:mb-2 [&_p:last-child]:mb-0',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
          '[&_blockquote]:border-l-[3px] [&_blockquote]:border-forest-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-forest-600 [&_blockquote]:my-2',
          '[&_a]:text-earth-500 [&_a]:underline',
          '[&_code]:bg-sand-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
          '[&_pre]:bg-forest-900 [&_pre]:text-sand-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
          '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2'
        ),
      },
    },
  })

  if (!editor) return null

  const charCount = editor.storage.characterCount.characters()

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={cn('border border-sand-300 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-sand-200 bg-sand-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        {variant === 'full' && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        )}

        <ToolbarDivider />

        {variant === 'full' && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarDivider />
          </>
        )}

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        {variant === 'full' && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        )}

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={handleLink} isActive={editor.isActive('link')} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        {variant === 'full' && (
          <>
            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className="text-xs text-forest-400 text-right p-1.5 border-t border-sand-200">
        {charCount.toLocaleString()}/{maxLength.toLocaleString()} characters
      </div>
    </div>
  )
}
