/** Only pass trusted SVG markup imported from repository assets with ?raw. */
export function SvgArtwork({ markup, className }: { markup: string; className?: string }) {
  const prefix = useId().replace(/\W/g, '')
  const isolated = markup
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
  const width = markup.match(/\bwidth="([\d.]+)"/)?.[1]
  const height = markup.match(/\bheight="([\d.]+)"/)?.[1]
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 [&>svg]:block ${className ?? ''}`}
      style={{
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: isolated }}
    />
  )
}
import { useId } from 'react'
