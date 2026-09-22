import React from 'react'
import CorteplanLogo from '@/components/CorteplanLogo'
import {
  formatDisplayDate,
  ADDRESS_TEXT,
  COPYRIGHT_LINE_1,
  COPYRIGHT_LINE_2,
  COPYRIGHT_LINE_3,
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
        <div className="w-full aspect-[297/210] bg-white border border-[#DCDCDC] shadow-lg rounded-sm p-[2.5%] flex flex-col justify-between select-none relative overflow-hidden">
          {type === 'cover' ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <CorteplanLogo variant="cover" />
            </div>
          ) : (
            <>
              {/* Address Top - discreto acima da área da imagem */}
              <div className="absolute top-[0.6%] left-0 right-0 text-center pointer-events-none z-10">
                <span className="text-[7.5px] sm:text-[9.5px] text-[#8E8E8E] font-medium tracking-wide">
                  {ADDRESS_TEXT}
                </span>
              </div>

              {/* Usable Image Area: margem superior ~2.5% até o rodapé (~85% de altura da página) */}
              <div className="w-full flex-1 min-h-0 border border-[#DCDCDC] bg-[#F7F7F5] overflow-hidden relative flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <span className="text-sm font-semibold text-[#6B6B6B]">{title}</span>
                    <span className="text-xs text-[#8E8E8E] mt-1">Nenhuma imagem carregada</span>
                  </div>
                )}
              </div>

              {/* Standard Footer faithful to Corteplan reference board (~15% da altura) */}
              <div className="w-full h-[15%] shrink-0 border-t border-[#DCDCDC] flex items-center relative text-[7px] sm:text-[9px] text-[#1F1F1F]">
                {/* Bloco 1: Logo Oficial Corteplan (~13-14% da largura) */}
                <div className="shrink-0 flex items-center w-[13.5%] h-full py-[1%]">
                  <CorteplanLogo variant="footer" className="w-full max-h-[85%] object-contain" />
                </div>

                {/* Bloco 2: Barra vertical laranja + 3 linhas (CLIENTE, MODELO, DATA) */}
                <div className="flex items-center gap-2 sm:gap-2.5 h-full pl-[2%] pr-[1%]">
                  <div className="w-[3px] sm:w-[3.5px] h-[72%] bg-[#E08A2E] shrink-0 rounded-none" />
                  <div className="flex flex-col justify-center leading-[1.3] whitespace-nowrap">
                    <div>
                      <span className="font-bold text-[#5A5A5A]">CLIENTE: </span>
                      <span className="font-normal text-[#222222]">{data.cliente || '-'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#5A5A5A]">MODELO: </span>
                      <span className="font-normal text-[#222222]">{data.modelo || '-'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#5A5A5A]">DATA: </span>
                      <span className="font-normal text-[#222222]">
                        {formatDisplayDate(data.data) || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: 3 linhas (VENDEDOR, PROJETO, RESPONSÁVEL) começando em ~44% */}
                <div className="absolute left-[44%] flex flex-col justify-center leading-[1.3] whitespace-nowrap">
                  <div>
                    <span className="font-bold text-[#5A5A5A]">VENDEDOR: </span>
                    <span className="font-normal text-[#222222]">{data.vendedor || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#5A5A5A]">PROJETO: </span>
                    <span className="font-normal text-[#222222]">{data.projeto || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#5A5A5A]">RESPONSÁVEL: </span>
                    <span className="font-normal text-[#222222]">{data.responsavel || '-'}</span>
                  </div>
                </div>

                {/* Bloco 4: À direita: Caixa copyright antracite (#3A3A3A) + Número da página grande cinza */}
                <div className="ml-auto flex items-center gap-2.5 sm:gap-4 h-full py-[1%]">
                  <div className="bg-[#3A3A3A] text-white px-2 py-1.5 rounded-[4px] text-[5px] sm:text-[6.5px] leading-[1.3] tracking-tight font-normal text-left max-w-[170px] sm:max-w-[210px]">
                    <p className="truncate">{COPYRIGHT_LINE_1}</p>
                    <p className="truncate">{COPYRIGHT_LINE_2}</p>
                    <p className="truncate">{COPYRIGHT_LINE_3}</p>
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold text-[#737373] leading-none text-right font-sans min-w-[28px]">
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
