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
        <div className="w-full aspect-[297/210] bg-white border border-[#DCDCDC] shadow-lg rounded-sm select-none relative overflow-hidden">
          {/* Item 4: Moldura fina cinza clara (#DCDCDC) rente às bordas da folha (~1% de inset) */}
          <div className="absolute inset-[1%] border border-[#DCDCDC] pointer-events-none z-20" />

          {type === 'cover' ? (
            // Capa: sem rodapé, sem número
            <div className="relative w-full h-full flex flex-col justify-between">
              {/* Logo colorido centralizado horizontalmente e em ~45% da altura, w ~24% */}
              <div className="flex-1 flex items-center justify-center pb-[5%]">
                <div className="w-[24%] flex items-center justify-center">
                  <CorteplanLogo variant="cover" className="w-full" />
                </div>
              </div>

              {/* Faixa antracite na BASE com detalhe laranja diagonal e endereço em branco itálico */}
              <div className="w-full h-[4%] shrink-0 relative bg-[#3A3A3A] flex items-center justify-center">
                {/* Detalhe laranja diagonal no canto esquerdo da faixa */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4.5%] bg-[#E08A2E] z-10"
                  style={{
                    clipPath: 'polygon(0% 100%, 65% 100%, 100% 0%, 35% 0%)',
                  }}
                />

                {/* Endereço em texto branco ITÁLICO centralizado */}
                <span className="text-[6.5px] sm:text-[8.5px] md:text-[9.5px] text-white italic font-medium tracking-wide truncate px-8 z-10">
                  {ADDRESS_TEXT}
                </span>

                {/* Filete laranja (#E08A2E) fino na base logo abaixo */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E08A2E]" />
              </div>
            </div>
          ) : (
            // Prancha de imagem: topo limpo (sem endereço), imagem com filete cinza claro, rodapé fiel
            <div className="relative w-full h-full p-[2.5%] pb-[1.5%] flex flex-col justify-between">
              {/* Usable Image Area: margem superior ~2.5% até o rodapé */}
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

              {/* Standard Footer faithful to Corteplan reference board (~11-12% da altura) */}
              <div className="w-full h-[12%] shrink-0 border-t border-[#DCDCDC] flex items-center relative text-[6.5px] sm:text-[8px] text-[#1F1F1F]">
                {/* Bloco 1: Logo monocromático/escuro no rodapé */}
                <div className="shrink-0 flex items-center w-[13.5%] h-full py-[1%]">
                  <CorteplanLogo variant="footer" className="w-full max-h-[75%] object-contain" />
                </div>

                {/* Bloco 2: Barra vertical laranja curta + 3 linhas (CLIENTE, MODELO, DATA) */}
                <div className="flex items-center gap-2 sm:gap-2.5 h-full pl-[2%] pr-[1%]">
                  <div className="w-[2.5px] sm:w-[3px] h-[55%] bg-[#E08A2E] shrink-0" />
                  <div className="flex flex-col justify-center leading-[1.25] whitespace-nowrap">
                    <div>
                      <span className="font-bold text-[#3A3A3A]">CLIENTE: </span>
                      <span className="font-normal text-[#222222]">{data.cliente || '-'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#3A3A3A]">MODELO: </span>
                      <span className="font-normal text-[#222222]">{data.modelo || '-'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#3A3A3A]">DATA: </span>
                      <span className="font-normal text-[#222222]">
                        {formatDisplayDate(data.data) || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: 3 linhas (VENDEDOR, PROJETO, RESPONSÁVEL) em ~44% */}
                <div className="absolute left-[44%] flex flex-col justify-center leading-[1.25] whitespace-nowrap">
                  <div>
                    <span className="font-bold text-[#3A3A3A]">VENDEDOR: </span>
                    <span className="font-normal text-[#222222]">{data.vendedor || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#3A3A3A]">PROJETO: </span>
                    <span className="font-normal text-[#222222]">{data.projeto || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#3A3A3A]">RESPONSÁVEL: </span>
                    <span className="font-normal text-[#222222]">{data.responsavel || '-'}</span>
                  </div>
                </div>

                {/* Bloco 4: Caixa de copyright antracite (#3A3A3A) + Número grande cinza (#737373, peso 900) */}
                <div className="ml-auto flex items-center gap-2 sm:gap-3.5 h-full py-[1%]">
                  <div className="bg-[#3A3A3A] text-white px-2 py-1 rounded-[3px] text-[4.5px] sm:text-[5.5px] leading-[1.25] tracking-tight font-normal text-left max-w-[150px] sm:max-w-[190px]">
                    <p className="truncate">{COPYRIGHT_LINE_1}</p>
                    <p className="truncate">{COPYRIGHT_LINE_2}</p>
                    <p className="truncate">{COPYRIGHT_LINE_3}</p>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#737373] leading-none text-right font-sans min-w-[28px]">
                    {pageNumStr}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
