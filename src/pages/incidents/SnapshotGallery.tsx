import type { IncidentAttachmentDto } from '@sr/shared'
import { ChevronLeft, ChevronRight, FileText, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IconButton } from '../../components/ui'

export function SnapshotGallery({ attachments, onDelete }: { attachments: IncidentAttachmentDto[]; onDelete?: (a: IncidentAttachmentDto) => void }) {
  const images = attachments.filter((a) => a.mimeType.startsWith('image/'))
  const [viewing, setViewing] = useState<number | null>(null)

  useEffect(() => {
    if (viewing === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewing(null)
      if (e.key === 'ArrowRight') setViewing((v) => (v === null ? v : (v + 1) % images.length))
      if (e.key === 'ArrowLeft') setViewing((v) => (v === null ? v : (v - 1 + images.length) % images.length))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewing, images.length])

  if (attachments.length === 0) return <p className="text-sm text-slate-500">No snapshots.</p>
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {attachments.map((a) => (
          <li key={a.id} className="group relative overflow-hidden rounded-lg border border-line bg-slate-50">
            {a.mimeType.startsWith('image/') ? (
              <button type="button" className="block aspect-[4/3] w-full" onClick={() => setViewing(images.indexOf(a))} aria-label={`View ${a.originalName}`}>
                <img src={a.url} alt={a.originalName} loading="lazy" className="size-full object-cover" />
              </button>
            ) : (
              <a href={a.url} target="_blank" rel="noreferrer" className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 text-xs text-slate-600">
                <FileText className="size-6 text-slate-400" aria-hidden />
                <span className="max-w-full truncate px-2">{a.originalName}</span>
              </a>
            )}
            {onDelete && a.canDelete && (
              <button
                type="button"
                aria-label={`Remove ${a.originalName}`}
                onClick={() => { if (confirm(`Remove ${a.originalName}?`)) onDelete(a) }}
                className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-slate-600 opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {viewing !== null && images[viewing] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Snapshot viewer">
          <IconButton label="Close viewer" className="absolute right-4 top-4 text-white hover:bg-white/10" onClick={() => setViewing(null)}><X /></IconButton>
          {images.length > 1 && <IconButton label="Previous snapshot" className="absolute left-4 text-white hover:bg-white/10" onClick={() => setViewing((viewing - 1 + images.length) % images.length)}><ChevronLeft /></IconButton>}
          <figure className="max-h-full max-w-5xl">
            <img src={images[viewing].url} alt={images[viewing].originalName} className="max-h-[80vh] rounded-lg object-contain" />
            <figcaption className="mt-2 text-center text-sm text-slate-300">{images[viewing].originalName} · {viewing + 1} / {images.length}</figcaption>
          </figure>
          {images.length > 1 && <IconButton label="Next snapshot" className="absolute right-4 text-white hover:bg-white/10" onClick={() => setViewing((viewing + 1) % images.length)}><ChevronRight /></IconButton>}
        </div>
      )}
    </>
  )
}
