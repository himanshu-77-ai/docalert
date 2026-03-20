'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onUpload: (result: { url: string; fileName: string; fileSize: number; mimeType: string }) => void
  existingUrl?: string
  existingName?: string
}

export default function FileUploader({ onUpload, existingUrl, existingName }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(
    existingUrl ? { url: existingUrl, name: existingName || 'Document', type: existingUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg' } : null
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only PDF and image files are allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview({ url: data.url, name: data.fileName, type: data.mimeType })
      onUpload(data)
      toast.success('File uploaded!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  if (preview) {
    return (
      <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          {preview.type === 'application/pdf'
            ? <FileText size={18} className="text-blue-600" />
            : <Image size={18} className="text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{preview.name}</p>
          <p className="text-xs text-gray-400">{preview.type === 'application/pdf' ? 'PDF document' : 'Image'}</p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <button
            type="button"
            onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = '' }}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}
        ${uploading ? 'cursor-wait opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={22} className="text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Drop file here or <span className="text-gray-900 underline">browse</span></p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG — max 10MB</p>
        </div>
      )}
    </div>
  )
}
