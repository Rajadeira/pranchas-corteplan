import React, { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadZoneProps {
  label: string
  helperText?: string
  required?: boolean
  file: File | null
  previewUrl: string | null
  error?: string | null
  onFileSelect: (file: File) => void
  onRemove: () => void
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  label,
  helperText,
  required = false,
  previewUrl,
  error,
  onFileSelect,
  onRemove,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith('image/')) {
        onFileSelect(droppedFile)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#1F1F1F]">
          {label} {required && <span className="text-[#F2612A]">*</span>}
        </label>
        {helperText && <span className="text-[11px] text-[#6B6B6B]">{helperText}</span>}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center min-h-[140px] text-center p-3 select-none ${
          previewUrl ? 'border-solid border-[#DCDCDC] bg-white' : 'border-dashed cursor-pointer'
        } ${
          isDragOver
            ? 'border-[#F2612A] bg-[#FFF3EC]'
            : !previewUrl
              ? error
                ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
                : 'border-[#DCDCDC] bg-[#F7F7F5] hover:bg-[#F0F0EE] hover:border-[#B5B5B5]'
              : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />

        {previewUrl ? (
          <div className="relative w-full h-[140px] group flex items-center justify-center bg-[#F7F7F5] rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="h-8 text-xs bg-white text-[#1F1F1F] hover:bg-white/90"
              >
                Trocar Imagem
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="h-8 text-xs bg-red-600 hover:bg-red-700"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Remover
              </Button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-xs text-[#1F1F1F] hover:bg-red-600 hover:text-white transition-colors"
              title="Remover imagem"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 px-4 space-y-1.5 text-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center text-[#F2612A]">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-[#1F1F1F]">
              Arraste a imagem aqui ou{' '}
              <span className="text-[#F2612A] underline">clique para selecionar</span>
            </div>
            <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>JPG, PNG ou WEBP (alta resolução recomendada)</span>
            </div>
          </div>
        )}
      </div>

      {error && !previewUrl && (
        <span className="text-xs text-red-600 font-medium pl-1">{error}</span>
      )}
    </div>
  )
}
