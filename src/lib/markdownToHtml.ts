/**
 * src/lib/markdownToHtml.ts
 * 책임: 마크다운을 안전한 HTML로 변환하는 헬퍼
 * 주요 exports: markdownToHtml
 * 한글 설명: rehype-sanitize를 통해 XSS 위험을 완화합니다.
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * markdownToHtml
 * @param markdown 마크다운 원문
 * @returns Promise<string> 안전하게 변환된 HTML 문자열
 * 설명: remark->rehype 파이프라인을 사용하며, 최종적으로 rehype-sanitize로 필터링합니다.
 */
/**
 * markdownToHtml
 * @param markdown 마크다운 원문
 * @returns Promise<string> - 변환된 HTML 문자열
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown)
  // 왜: unified의 결과를 문자열로 변환하여 컴포넌트가 innerHTML로 안전히 사용할 수 있도록 한다.
  return String(file)
}

export default markdownToHtml
