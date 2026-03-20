'use client'
import { useState } from 'react'
import { X, ExternalLink, Download, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  url: string
  fileName: string
  mimeType: string
  onClose: () => void
}

export default function DocumentViewer({ url, fileName, mimeType, onClose }: Props) {
  const [zoom, setZoom] = useState(1)
  const isPDF = mimeType === 'application/pdf'
  const isImage = mimeType.startsWith('image/')

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isImage && (
            <>
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-gray-400 min-w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </>
          )}
          <a
            href={url}
            download={fileName}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Download"
          >
            <Download size={16} />
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </a>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8">
        {isPDF && (
          <iframe
            src={`${url}#view=FitH`}
            className="w-full max-w-4xl rounded-lg bg-white"
            style={{ height: 'calc(100vh - 120px)', minHeight: 400 }}
            title={fileName}
          />
        )}
        {isImage && (
          <img
            src={url}
            alt={fileName}
            className="rounded-lg shadow-2xl max-w-full transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          />
        )}
        {!isPDF && !isImage && (
          <div className="text-center text-white mt-20">
            <p className="text-lg mb-4">Preview not available for this file type.</p>
            <a href={url} download={fileName} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Download file
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
