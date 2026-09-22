import React from 'react'
import { formatDisplayDate, capaAssetUrl, folhaMolduraAssetUrl } from '@/lib/pdf/generator'
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
                className="absolute overflow-hidden bg-[#F7F7F5] border border-[#DCDCDC]"
                style={{
                  left: '2.5%',
                  top: '3.55%',
                  width: '95%',
                  height: '85.16%',
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                    <span className="text-sm font-semibold text-[#6B6B6B]">{title}</span>
                    <span className="text-xs text-[#8E8E8E] mt-1">Nenhuma imagem carregada</span>
                  </div>
                )}
              </div>

              {/* Template travado: moldura, logo, divisor laranja, labels, caixa de copyright */}
              <img
                src={folhaMolduraAssetUrl}
                alt="Template Prancha Travado"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />

              {/* Valores dinâmicos e número da página em posições fixas sobre o template */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Coluna 1: CLIENTE, MODELO, DATA (x = 21.66%) */}
                <div
                  className="absolute flex flex-col justify-between text-[7px] sm:text-[9px] md:text-[10px] leading-none font-normal text-[#222222] whitespace-nowrap"
                  style={{
                    left: '21.66%',
                    top: '90.2%',
                    height: '5.8%',
                  }}
                >
                  <div className="truncate max-w-[200px]">{data.cliente || ''}</div>
                  <div className="truncate max-w-[200px]">{data.modelo || ''}</div>
                  <div className="truncate max-w-[200px]">{formatDisplayDate(data.data) || ''}</div>
                </div>

                {/* Coluna 2: VENDEDOR, PROJETO, RESPONSÁVEL (x = 51.6%) */}
                <div
                  className="absolute flex flex-col justify-between text-[7px] sm:text-[9px] md:text-[10px] leading-none font-normal text-[#222222] whitespace-nowrap"
                  style={{
                    left: '51.6%',
                    top: '90.2%',
                    height: '5.8%',
                  }}
                >
                  <div className="truncate max-w-[240px]">{data.vendedor || ''}</div>
                  <div className="truncate max-w-[240px]">{data.projeto || ''}</div>
                  <div className="truncate max-w-[240px]">{data.responsavel || ''}</div>
                </div>

                {/* Número grande da página (alinhado à direita com a foto, ~97.5%) */}
                <div
                  className="absolute text-right font-black text-[#737373] leading-none select-none"
                  style={{
                    right: '2.5%',
                    bottom: '4.8%',
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
