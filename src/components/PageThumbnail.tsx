import React from 'react'
import { formatDisplayDate, capaAssetUrl, folhaMolduraAssetUrl } from '@/lib/pdf/generator'
import type { BoardData } from '@/lib/pdf/generator'

interface PageThumbnailProps {
  pageNumber: number
  type: 'cover' | 'render' | 'ambiente' | 'desenho'
  title: string
  data: BoardData
  imageUrl?: string | null
  onClick?: () => void
  className?: string
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pageNumber,
  type,
  title,
  data,
  imageUrl,
  onClick,
  className = '',
}) => {
  const pageNumStr = pageNumber > 0 ? (pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`) : ''

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border border-[#DCDCDC] rounded-xl shadow-xs overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#F2612A]/60 hover:scale-[1.01] ${className}`}
    >
      {/* 297 x 210 aspect ratio container (approx 1.414:1) */}
      <div className="relative w-full aspect-[297/210] bg-white overflow-hidden select-none">
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
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 text-[#8E8E8E]">
                  <span className="text-[8px] sm:text-[10px] font-semibold text-[#6B6B6B]">
                    {title}
                  </span>
                  <span className="text-[6px] sm:text-[7.5px]">Sem imagem</span>
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
                className="absolute flex flex-col justify-between text-[3.8px] sm:text-[4.6px] md:text-[5.4px] leading-none font-normal text-[#222222] whitespace-nowrap"
                style={{
                  left: '21.66%',
                  top: '90.2%',
                  height: '5.8%',
                }}
              >
                <div className="truncate max-w-[100px]">{data.cliente || ''}</div>
                <div className="truncate max-w-[100px]">{data.modelo || ''}</div>
                <div className="truncate max-w-[100px]">{formatDisplayDate(data.data) || ''}</div>
              </div>

              {/* Coluna 2: VENDEDOR, PROJETO, RESPONSÁVEL (x = 51.6%) */}
              <div
                className="absolute flex flex-col justify-between text-[3.8px] sm:text-[4.6px] md:text-[5.4px] leading-none font-normal text-[#222222] whitespace-nowrap"
                style={{
                  left: '51.6%',
                  top: '90.2%',
                  height: '5.8%',
                }}
              >
                <div className="truncate max-w-[120px]">{data.vendedor || ''}</div>
                <div className="truncate max-w-[120px]">{data.projeto || ''}</div>
                <div className="truncate max-w-[120px]">{data.responsavel || ''}</div>
              </div>

              {/* Número grande da página (alinhado à direita com a foto, ~97.5%) */}
              <div
                className="absolute text-right font-black text-[#737373] leading-none select-none"
                style={{
                  right: '2.5%',
                  bottom: '4.8%',
                  fontSize: 'clamp(14px, 4.4cqi, 20px)',
                  letterSpacing: '-0.5px',
                }}
              >
                {pageNumStr}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Label footer of card */}
      <div className="px-3 py-1.5 bg-[#F7F7F5] border-t border-[#E5E5E5] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1F1F1F]">
          {type === 'cover' ? 'Capa' : `Página ${pageNumStr}`}
        </span>
        <span className="text-[11px] text-[#6B6B6B] font-medium">{title}</span>
      </div>
    </div>
  )
}
