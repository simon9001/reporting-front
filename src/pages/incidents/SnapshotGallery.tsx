import type { IncidentAttachmentDto } from '@sr/shared'
import { ChevronLeft, ChevronRight, FileText, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { pushLayer } from '../../components/layers'
import { IconButton } from '../../components/ui'

const FOCUSABLE = 'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'

function Viewer({ images, index, setIndex, onClose }: { images: IncidentAttachmentDto[]; index: number; setIndex: (i: number) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const state = useRef({ index, count: images.length, onClose, setIndex })
  useEffect(() => { state.current = { index, count: images.length, onClose, setIndex } })
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const layer = pushLayer()
    box.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (!layer.isTop()) return
      const { index: i, count, onClose: close, setIndex: set } = state.current
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key === 'ArrowRight') set((i + 1) % count)
      else if (e.key === 'ArrowLeft') set((i - 1 + count) % count)
      else if (e.key === 'Tab' && box.current) {
        const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (items.length === 0) { e.preventDefault(); box.current.focus(); return }
        const first = items[0]!
        const last = items[items.length - 1]!
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === box.current)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
        else if (!box.current.contains(active)) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      layer.pop()
      opener?.focus()
    }
  }, [])
  const img = images[index]!
  return (
    <div ref={box} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 outline-none" role="dialog" aria-modal="true" aria-label="Snapshot viewer">
      <IconButton label="Close viewer" className="absolute right-4 top-4 text-white hover:bg-white/10" onClick={onClose}><X /></IconButton>
      {images.length > 1 && <IconButton label="Previous snapshot" className="absolute left-4 text-white hover:bg-white/10" onClick={() => setIndex((index - 1 + images.length) % images.length)}><ChevronLeft /></IconButton>}
      <figure className="max-h-full max-w-5xl">
        <img src={img.url} alt={img.originalName} className="max-h-[80vh] rounded-lg object-contain" />
        <figcaption className="mt-2 text-center text-sm text-slate-300">{img.originalName} · {index + 1} / {images.length}</figcaption>
      </figure>
      {images.length > 1 && <IconButton label="Next snapshot" className="absolute right-4 text-white hover:bg-white/10" onClick={() => setIndex((index + 1) % images.length)}><ChevronRight /></IconButton>}
    </div>
  )
}

export function SnapshotGallery({ attachments, onDelete }: { attachments: IncidentAttachmentDto[]; onDelete?: (a: IncidentAttachmentDto) => void }) {
  const images = attachments.filter((a) => a.mimeType.startsWith('image/'))
  const [viewing, setViewing] = useState<number | null>(null)

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
              <a href={a.url} download={a.originalName} aria-label={`Download ${a.originalName}`} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 text-xs text-slate-600">
                <FileText className="size-6 text-slate-400" aria-hidden />
                <span className="max-w-full truncate px-2">{a.originalName}</span>
                <span className="text-[11px] text-brand-700">Download PDF</span>
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
      {viewing !== null && images[viewing] && <Viewer images={images} index={viewing} setIndex={setViewing} onClose={() => setViewing(null)} />}
    </>
  )
}
