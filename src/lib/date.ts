/**
 * src/lib/date.ts
 * 책임: 날짜 문자열을 포맷팅하여 표시 형식으로 변환
 * 주요 exports: formatPostDate(dateStr) -> string
 * 한글 설명: 날짜를 YYYY-MM-DD 형식으로, 시간이 있으면 · HH:MM을 추가합니다.
 */

export function formatPostDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr

    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const datePart = `${yyyy}-${mm}-${dd}`

    // Detect whether original string contained a time component
    const hasTime = /T|:\d{2}/.test(dateStr)
    if (!hasTime) return datePart

    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${datePart} · ${hh}:${min}`
  } catch {
    return dateStr
  }
}
