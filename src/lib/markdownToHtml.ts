/**
 * src/lib/markdownToHtml.ts
 * Responsibility: Default export markdownToHtml
 * Auto-generated header: add more descriptive responsibility by hand.
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSanitize from 'rehype-sanitize'

// Convert markdown string to sanitized HTML string using unified
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}

export default markdownToHtml
