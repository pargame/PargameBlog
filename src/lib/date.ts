/**
 * src/lib/date.ts
 * Responsibility: Exports formatPostDate
 * Auto-generated header: add more descriptive responsibility by hand.
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
