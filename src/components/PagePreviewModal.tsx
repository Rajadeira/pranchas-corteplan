import React from 'react'
import CorteplanLogo from '@/components/CorteplanLogo'
import {
  formatDisplayDate,
  ADDRESS_TEXT,
  COPYRIGHT_LINE_1,
  COPYRIGHT_LINE_2,
} from '@/lib/pdf/generator'
import type { BoardData } from '@/lib/pdf/generator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pageNumber: number
  type: 'cover' | 'render' | 'ambiente' | 'desenho'
  title: string
  data: BoardData
  imageUrl?: string | null
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  isOpen,
  onClose,
  pageNumber,
  type,
  title,
  data,
  imageUrl,
}) => {
  const pageNumStr = pageNumber > 0 ? (pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`) : ''

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-4 sm:p-6 bg-white overflow-hidden rounded-2xl border border-[#DCDCDC]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base sm:text-lg font-bold text-[#1F1F1F] flex items-center justify-between">
            <span>
              {type === 'cover'
                ? 'Pré-visualização: Capa'
                : `Pré-visualização: Página ${pageNumStr} (${title})`}
            </span>
            <span className="text-xs font-normal text-[#6B6B6B]">A4 Paisagem (297×210mm)</span>
          </DialogTitle>
        </DialogHeader>

        {/* Paper sheet container */}
        <div className="w-full aspect-[297/210] bg-white border border-[#DCDCDC] shadow-lg rounded-sm p-4 sm:p-6 flex flex-col justify-between select-none relative overflow-hidden">
          {type === 'cover' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <CorteplanLogo variant="cover" />
            </div>
          ) : (
            <>
              {/* Address Top */}
              <div className="w-full text-center py-1">
                <span className="text-[8.5px] sm:text-[10.5px] text-[#8E8E8E] font-medium tracking-wide">
                  {ADDRESS_TEXT}
                </span>
              </div>

              {/* Image Area */}
              <div className="flex-1 w-full my-2 border border-[#DCDCDC] bg-[#F7F7F5] overflow-hidden relative flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <span className="text-sm font-semibold text-[#6B6B6B]">{title}</span>
                    <span className="text-xs text-[#8E8E8E] mt-1">Nenhuma imagem carregada</span>
                  </div>
                )}
              </div>

              {/* Standard Footer faithful to Corteplan reference board */}
              <div className="w-full pt-2 border-t border-[#DCDCDC] flex items-center justify-between text-[7.5px] sm:text-[9.5px] text-[#1F1F1F] gap-2">
                {/* Block 1: Logo */}
                <div className="shrink-0">
                  <CorteplanLogo variant="footer" />
                </div>

                {/* Block 2: Orange Bar + 3 lines (CLIENTE:, MODELO:, DATA:) */}
                <div className="flex items-center gap-2 border-l-[3px] border-[#F2612A] pl-2 shrink-0">
                  <div className="flex flex-col leading-tight">
                    <span className="truncate max-w-[150px] sm:max-w-[180px]">
                      <span className="text-[#6B6B6B] font-semibold">CLIENTE: </span>
                      <span className="text-[#1F1F1F] font-medium">{data.cliente || '-'}</span>
                    </span>
                    <span className="truncate max-w-[150px] sm:max-w-[180px]">
                      <span className="text-[#6B6B6B] font-semibold">MODELO: </span>
                      <span className="text-[#1F1F1F] font-medium">{data.modelo || '-'}</span>
                    </span>
                    <span className="truncate max-w-[150px] sm:max-w-[180px]">
                      <span className="text-[#6B6B6B] font-semibold">DATA: </span>
                      <span className="text-[#1F1F1F] font-medium">
                        {formatDisplayDate(data.data) || '-'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Block 3: 3 lines (VENDEDOR:, PROJETO:, RESPONSÁVEL:) */}
                <div className="flex flex-col leading-tight shrink-0">
                  <span className="truncate max-w-[160px] sm:max-w-[210px]">
                    <span className="text-[#6B6B6B] font-semibold">VENDEDOR: </span>
                    <span className="text-[#1F1F1F] font-medium">{data.vendedor || '-'}</span>
                  </span>
                  <span className="truncate max-w-[160px] sm:max-w-[210px]">
                    <span className="text-[#6B6B6B] font-semibold">PROJETO: </span>
                    <span className="text-[#1F1F1F] font-medium">{data.projeto || '-'}</span>
                  </span>
                  <span className="truncate max-w-[160px] sm:max-w-[210px]">
                    <span className="text-[#6B6B6B] font-semibold">RESPONSÁVEL: </span>
                    <span className="text-[#1F1F1F] font-medium">{data.responsavel || '-'}</span>
                  </span>
                </div>

                {/* Block 4: Copyright box + Big Page Number */}
                <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                  <div className="bg-[#3F444A] text-white px-2 py-1.5 rounded-[2px] text-[6px] sm:text-[7.5px] leading-tight max-w-[190px] sm:max-w-[240px]">
                    <p className="font-normal">{COPYRIGHT_LINE_1}</p>
                    <p className="font-normal">{COPYRIGHT_LINE_2}</p>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#6B6B6B] tracking-tight shrink-0 min-w-[28px] text-right">
                    {pageNumStr}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
