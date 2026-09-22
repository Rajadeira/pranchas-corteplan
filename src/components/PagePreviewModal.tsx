import React from 'react'
import {
  formatDisplayDate,
  capaAssetUrl,
  folhaMolduraAssetUrl,
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
            // Capa: Imagem PNG oficial do usuário cobrindo a folha inteira
            <div className="relative w-full h-full">
              <img
                src={capaAssetUrl}
                alt="Capa Corteplan"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          ) : (
            // Prancha de imagem: template travado idêntico à referência (folha-01)
            <div className="relative w-full h-full">
              {/* Foto carregada no container determinístico (x: 2.5%, y: 3.55%, w: 95%, h: 85.16%) */}
              <div
                className="absolute overflow-hidden bg-white border border-[#DCDCDC]"
                style={{
                  left: '2.5%',
                  top: '3.55%',
                  width: '95%',
                  height: '85.16%',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-contain object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#F7F7F5]">
                    <span className="text-sm font-semibold text-[#6B6B6B]">{title}</span>
                    <span className="text-xs text-[#8E8E8E] mt-1">Nenhuma imagem carregada</span>
                  </div>
                )}
              </div>

              {/* Template travado da folha: moldura, separador de foto, logo grafite e barra laranja */}
              <img
                src={folhaMolduraAssetUrl}
                alt="Template Prancha Travado"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />

              {/* Overlays dinâmicos sobre a folha: labels, valores, caixa de copyright e número de página */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Coluna 1: CLIENTE, MODELO, DATA (x = 17.2%, imediatamente à direita da barra laranja) */}
                <div
                  className="absolute flex flex-col justify-between text-[6.5px] sm:text-[8px] md:text-[9.5px] leading-none whitespace-nowrap"
                  style={{
                    left: '17.2%',
                    top: '90.3%',
                    height: '5.7%',
                  }}
                >
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    <span className="font-bold text-[#3A3A3A]">CLIENTE:</span>
                    <span className="font-normal text-[#222222]">{data.cliente || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    <span className="font-bold text-[#3A3A3A]">MODELO:</span>
                    <span className="font-normal text-[#222222]">{data.modelo || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    <span className="font-bold text-[#3A3A3A]">DATA:</span>
                    <span className="font-normal text-[#222222]">
                      {formatDisplayDate(data.data) || '-'}
                    </span>
                  </div>
                </div>

                {/* Coluna 2: VENDEDOR, PROJETO, RESPONSÁVEL (x = 44.2%) */}
                <div
                  className="absolute flex flex-col justify-between text-[6.5px] sm:text-[8px] md:text-[9.5px] leading-none whitespace-nowrap"
                  style={{
                    left: '44.2%',
                    top: '90.3%',
                    height: '5.7%',
                  }}
                >
                  <div className="flex items-center gap-1 truncate max-w-[230px]">
                    <span className="font-bold text-[#3A3A3A]">VENDEDOR:</span>
                    <span className="font-normal text-[#222222]">{data.vendedor || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[230px]">
                    <span className="font-bold text-[#3A3A3A]">PROJETO:</span>
                    <span className="font-normal text-[#222222]">{data.projeto || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[230px]">
                    <span className="font-bold text-[#3A3A3A]">RESPONSÁVEL:</span>
                    <span className="font-normal text-[#222222]">{data.responsavel || '-'}</span>
                  </div>
                </div>

                {/* Caixa Antracite de Copyright (#3A3A3A) */}
                <div
                  className="absolute bg-[#3A3A3A] rounded-[3px] flex flex-col justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[#FFFFFF] leading-[1.2]"
                  style={{
                    left: '71.0%',
                    top: '90.3%',
                    width: '19.5%',
                    height: '5.6%',
                    fontSize: 'clamp(4.5px, 0.75cqi, 7.5px)',
                  }}
                >
                  <span className="truncate">{COPYRIGHT_LINE_1}</span>
                  <span className="truncate">{COPYRIGHT_LINE_2}</span>
                  <span className="truncate">{COPYRIGHT_LINE_3}</span>
                </div>

                {/* Número grande da página (alinhado à direita com a foto, ~97.5%) */}
                <div
                  className="absolute text-right font-black text-[#737373] leading-none select-none"
                  style={{
                    right: '2.5%',
                    bottom: '4.2%',
                    fontSize: 'clamp(28px, 4.4cqi, 40px)',
                    letterSpacing: '-1px',
                  }}
                >
                  {pageNumStr}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
