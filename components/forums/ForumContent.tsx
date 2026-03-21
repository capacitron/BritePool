'use client'

import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

interface ForumContentProps {
  content: string
  className?: string
}

export function ForumContent({ content, className }: ForumContentProps) {
  const sanitized = sanitizeHtml(content)

  return (
    <div
      className={cn(
        'forum-content',
        '[&_h2]:text-lg [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-forest-800 [&_h2]:mt-4 [&_h2]:mb-2',
        '[&_h3]:text-base [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-forest-800 [&_h3]:mt-3 [&_h3]:mb-1',
        '[&_p]:mb-2 [&_p:last-child]:mb-0',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
        '[&_li]:mb-0.5',
        '[&_blockquote]:border-l-[3px] [&_blockquote]:border-forest-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-forest-600 [&_blockquote]:my-2',
        '[&_a]:text-earth-500 [&_a]:underline hover:[&_a]:text-earth-600',
        '[&_code]:bg-sand-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
        '[&_pre]:bg-forest-900 [&_pre]:text-sand-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
