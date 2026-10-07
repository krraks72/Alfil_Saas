import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Button } from './button'
import { Separator } from './separator'
import { Input } from './input'
import { Label } from './label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './dialog'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Code
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export interface RichTextEditorRef {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  editable = true
}, ref) => {
  const [showHtml, setShowHtml] = useState(false)
  const [htmlContent, setHtmlContent] = useState(content)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (!showHtml) {
        onChange?.(editor.getHTML())
      }
    },
  })

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || '',
    setContent: (content: string) => editor?.commands.setContent(content),
    focus: () => editor?.commands.focus(),
  }))

  if (!editor) {
    return null
  }

  const addLink = () => {
    // Get existing link URL if text is selected and has a link
    const existingUrl = editor.getAttributes('link').href || ''
    setLinkUrl(existingUrl)
    setShowLinkModal(true)
    setLinkError('')
  }

  const validateAndInsertLink = () => {
    // Clear previous error
    setLinkError('')

    // Required field validation
    if (!linkUrl.trim()) {
      setLinkError('URL is required.')
      return
    }

    // URL format validation
    try {
      new URL(linkUrl.trim())
    } catch {
      setLinkError('Please enter a valid URL (e.g. https://example.com).')
      return
    }

    // If validation passes, insert the link
    editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkError('')
  }

  const toggleHtmlView = () => {
    if (showHtml) {
      // Switch back to editor view
      editor?.commands.setContent(htmlContent, false)
      onChange?.(htmlContent)
      setShowHtml(false)
    } else {
      // Switch to HTML view - use original content if available
      const currentHtml = content || editor?.getHTML() || ''
      setHtmlContent(currentHtml)
      setShowHtml(true)
    }
  }

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value
    setHtmlContent(newHtml)
    onChange?.(newHtml)
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {editable && (
        <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
          >
            <Unlink className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleHtmlView}
            className={showHtml ? 'bg-muted' : ''}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showHtml ? (
        <textarea
          value={htmlContent}
          onChange={handleHtmlChange}
          className="w-full p-4 min-h-[200px] font-mono text-sm border-0 resize-none focus:outline-none bg-gray-50 break-all overflow-wrap-anywhere whitespace-pre-wrap overflow-x-hidden"
          placeholder="Enter HTML content..."
        />
      ) : (
        <EditorContent
          editor={editor}
          onClick={() => editor?.commands.focus()}
          className="prose prose-sm max-w-none focus-within:outline-none [&_.ProseMirror]:p-4 [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:cursor-text [&_.ProseMirror]:break-all [&_.ProseMirror]:overflow-wrap-anywhere [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:overflow-x-hidden"
        />
      )}

      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold text-foreground truncate">
              {editor.getAttributes('link').href ? t('Edit Link') : t('Insert Link')}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="link-url" required>
                {t('URL')}
              </Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value)
                  if (linkError) {
                    setLinkError('')
                  }
                }}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    validateAndInsertLink()
                  }
                }}
                autoFocus
                required
                className={linkError ? 'border-red-500' : ''}
              />
              {linkError && (
                <p className="text-sm text-red-500 mt-1">{linkError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowLinkModal(false)
                setLinkUrl('')
                setLinkError('')
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={validateAndInsertLink}
            >
              {editor.getAttributes('link').href ? t('Update') : t('Insert')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }
