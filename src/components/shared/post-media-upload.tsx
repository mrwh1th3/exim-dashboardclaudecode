'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'

interface PostMediaUploadProps {
  clientId: string
  uploadedBy: string
  value: string[]          // current media_urls
  onChange: (urls: string[]) => void
  maxFiles?: number
}

export function PostMediaUpload({
  clientId,
  uploadedBy,
  value,
  onChange,
  maxFiles = 10,
}: PostMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!clientId) { toast.error('Selecciona un cliente primero'); return }

    const remaining = maxFiles - value.length
    if (remaining <= 0) { toast.error(`Máximo ${maxFiles} imágenes`); return }

    const toUpload = Array.from(files).slice(0, remaining)
    const invalid = toUpload.filter((f) => !f.type.startsWith('image/') && !f.type.startsWith('video/'))
    if (invalid.length > 0) { toast.error('Solo se permiten imágenes y videos'); return }

    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const file of toUpload) {
      const path = `${clientId}/posts/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const { error } = await supabase.storage.from('social-files').upload(path, file)
      if (error) { toast.error(`Error subiendo ${file.name}`); continue }
      const { data: urlData } = supabase.storage.from('social-files').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }

    if (urls.length > 0) {
      onChange([...value, ...urls])
      toast.success(`${urls.length} archivo${urls.length > 1 ? 's' : ''} subido${urls.length > 1 ? 's' : ''}`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeUrl(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  function isVideo(url: string) {
    return /\.(mp4|mov|webm|avi)$/i.test(url)
  }

  return (
    <div className="space-y-2">
      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
              {isVideo(url) ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              ) : (
                <img src={url} alt={`media ${i + 1}`} className="object-cover w-full h-full" />
              )}
              <button
                onClick={() => removeUrl(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {value.length < maxFiles && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:border-primary hover:bg-accent/30'}`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="text-xs text-muted-foreground">
            {uploading ? 'Subiendo...' : (
              <>
                <span className="font-medium text-foreground">Haz clic</span> o arrastra imágenes/videos aquí
                <br />{value.length}/{maxFiles} archivos
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
