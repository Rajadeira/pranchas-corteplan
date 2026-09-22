import React from 'react'
import CorteplanLogo from '@/components/CorteplanLogo'
import { formatDisplayDate, ADDRESS_TEXT, COPYRIGHT_TEXT } from '@/lib/pdf/generator'
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
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-4 sm:p-6 bg-white overflow-hidden rounded-2xl border border-[#DCDCDC]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base sm:text-lg font-bold text-[#1F1F1F] flex items-center justify-between">
            <span>
              Pré-visualização: Página {pageNumStr} ({title})
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
                <span className="text-[9px] sm:text-[11px] text-[#8E8E8E] font-medium tracking-wide">
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

              {/* Standard Footer */}
              <div className="w-full pt-2.5 border-t border-[#DCDCDC] flex items-center justify-between text-[8px] sm:text-[10px] text-[#1F1F1F]">
                {/* Block 1: Logo */}
                <div className="shrink-0">
                  <CorteplanLogo variant="footer" />
                </div>

                {/* Block 2: Orange Bar + 3 lines */}
                <div className="flex items-center gap-2 border-l-4 border-[#F2612A] pl-2">
                  <div className="flex flex-col leading-snug">
                    <span>
                      <strong className="text-[#6B6B6B] font-medium">Cliente: </strong>
                      <span className="font-bold">{data.cliente || '-'}</span>
                    </span>
                    <span>
                      <strong className="text-[#6B6B6B] font-medium">Modelo: </strong>
                      <span className="font-bold">{data.modelo || '-'}</span>
                    </span>
                    <span>
                      <strong className="text-[#6B6B6B] font-medium">Data: </strong>
                      <span className="font-bold">{formatDisplayDate(data.data) || '-'}</span>
                    </span>
                  </div>
                </div>

                {/* Block 3: 3 lines */}
                <div className="flex flex-col leading-snug">
                  <span>
                    <strong className="text-[#6B6B6B] font-medium">Vendedor: </strong>
                    <span className="font-bold">{data.vendedor || '-'}</span>
                  </span>
                  <span>
                    <strong className="text-[#6B6B6B] font-medium">Projeto: </strong>
                    <span className="font-bold">{data.projeto || '-'}</span>
                  </span>
                  <span>
                    <strong className="text-[#6B6B6B] font-medium">Responsável: </strong>
                    <span className="font-bold">{data.responsavel || '-'}</span>
                  </span>
                </div>

                {/* Block 4: Copyright box + Big Page Number */}
                <div className="flex items-center gap-3">
                  <div className="border border-[#DCDCDC] p-1 text-[6.5px] sm:text-[7.5px] leading-tight text-[#8A8A8A] max-w-[170px]">
                    {COPYRIGHT_TEXT}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
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
