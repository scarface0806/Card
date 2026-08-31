'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Underline as UnderlineIcon,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import { uploadBlogImage } from '@/lib/blog/upload-client';
import type { PostImageData } from '@/lib/blog/types';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onError?: (message: string) => void;
  /**
   * Fired for every image uploaded from inside the editor, so the form can
   * keep a record of the Cloudinary asset. Without it an inline image would
   * have no publicId anywhere and could never be cleaned up on delete.
   */
  onImageUploaded?: (image: PostImageData) => void;
}

type ToolButton = {
  key: string;
  label: string;
  icon: React.ReactNode;
  run: () => void;
  isActive?: () => boolean;
};

/**
 * Post body editor.
 *
 * The output is HTML, and it is sanitized again on the server before it is
 * stored — this toolbar decides what is convenient to write, not what is safe
 * to save. Styling comes entirely from `.tv-adm-editor` in globals.css, built
 * from the same tokens as the rest of the panel.
 */
export default function RichTextEditor({
  value,
  onChange,
  onError,
  onImageUploaded,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // Tiptap renders to the DOM; letting it render during SSR would produce
    // markup the client immediately replaces and a hydration warning with it.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The post page owns the single H1. Offering H1 here would let a body
        // heading compete with the title for it.
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer' },
        },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      Youtube.configure({ nocookie: true, width: 800, height: 450 }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'tv-adm-editor-body',
        'aria-label': 'Post content',
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      setUploading(true);
      try {
        const uploaded = await uploadBlogImage(file);

        // Alt text is required on every image the site renders, so it is asked
        // for at insert time rather than left to be forgotten.
        const alt =
          window.prompt('Alt text for this image (required for accessibility and SEO)')?.trim() || '';

        if (!alt) {
          onError?.('Image not inserted: alt text is required.');
          return;
        }

        editor
          .chain()
          .focus()
          .setImage({ src: uploaded.url, alt })
          .run();

        onImageUploaded?.({
          url: uploaded.url,
          publicId: uploaded.publicId,
          alt,
          width: uploaded.width,
          height: uploaded.height,
        });
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Image upload failed');
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    },
    [editor, onError, onImageUploaded]
  );

  const toggleLink = useCallback(() => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const href = window.prompt('Link URL (https://…)')?.trim();
    if (!href) return;

    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href)) {
      onError?.('Links must start with https://, mailto:, tel: or /');
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }, [editor, onError]);

  const insertYoutube = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('YouTube video URL')?.trim();
    if (!url) return;

    if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
      onError?.('That does not look like a YouTube URL.');
      return;
    }

    editor.commands.setYoutubeVideo({ src: url });
  }, [editor, onError]);

  if (!editor) {
    return <div className="tv-adm-skeleton h-64 w-full rounded-xl" aria-hidden="true" />;
  }

  const buttons = buildButtons(editor, toggleLink, insertYoutube);

  return (
    <div className="tv-adm-editor">
      <div className="tv-adm-editor-bar" role="toolbar" aria-label="Formatting">
        {buttons.map((button) =>
          button.key === 'sep' ? (
            <span key={`${button.key}-${button.label}`} className="tv-adm-editor-sep" aria-hidden="true" />
          ) : (
            <button
              key={button.key}
              type="button"
              onClick={button.run}
              title={button.label}
              aria-label={button.label}
              aria-pressed={button.isActive ? button.isActive() : undefined}
              className="tv-adm-editor-btn"
            >
              {button.icon}
            </button>
          )
        )}

        <span className="tv-adm-editor-sep" aria-hidden="true" />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          title="Insert image"
          aria-label="Insert image"
          className="tv-adm-editor-btn"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void insertImage(file);
        }}
      />
    </div>
  );
}

function buildButtons(
  editor: Editor,
  toggleLink: () => void,
  insertYoutube: () => void
): ToolButton[] {
  return [
    {
      key: 'h2',
      label: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      key: 'h3',
      label: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    { key: 'sep', label: 'a', icon: null, run: () => {} },
    {
      key: 'bold',
      label: 'Bold',
      icon: <Bold className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      key: 'italic',
      label: 'Italic',
      icon: <Italic className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      key: 'underline',
      label: 'Underline',
      icon: <UnderlineIcon className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    { key: 'sep', label: 'b', icon: null, run: () => {} },
    {
      key: 'bullet',
      label: 'Bullet list',
      icon: <List className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      key: 'ordered',
      label: 'Numbered list',
      icon: <ListOrdered className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      key: 'quote',
      label: 'Blockquote',
      icon: <Quote className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      key: 'code',
      label: 'Inline code',
      icon: <Code className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    },
    { key: 'sep', label: 'c', icon: null, run: () => {} },
    {
      key: 'link',
      label: editor.isActive('link') ? 'Remove link' : 'Add link',
      icon: editor.isActive('link') ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />,
      run: toggleLink,
      isActive: () => editor.isActive('link'),
    },
    {
      key: 'youtube',
      label: 'Embed YouTube video',
      icon: <YoutubeIcon className="h-4 w-4" />,
      run: insertYoutube,
    },
  ];
}
