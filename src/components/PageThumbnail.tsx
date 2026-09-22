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
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 text-[#8E8E8E] bg-[#F7F7F5]">
                  <span className="text-[8px] sm:text-[10px] font-semibold text-[#6B6B6B]">
                    {title}
                  </span>
                  <span className="text-[6px] sm:text-[7.5px]">Sem imagem</span>
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
                className="absolute flex flex-col justify-between text-[3.2px] sm:text-[4px] md:text-[4.8px] leading-none whitespace-nowrap"
                style={{
                  left: '17.2%',
                  top: '90.3%',
                  height: '5.7%',
                }}
              >
                <div className="flex items-center gap-[2px] truncate max-w-[110px]">
                  <span className="font-bold text-[#3A3A3A]">CLIENTE:</span>
                  <span className="font-normal text-[#222222]">{data.cliente || '-'}</span>
                </div>
                <div className="flex items-center gap-[2px] truncate max-w-[110px]">
                  <span className="font-bold text-[#3A3A3A]">MODELO:</span>
                  <span className="font-normal text-[#222222]">{data.modelo || '-'}</span>
                </div>
                <div className="flex items-center gap-[2px] truncate max-w-[110px]">
                  <span className="font-bold text-[#3A3A3A]">DATA:</span>
                  <span className="font-normal text-[#222222]">
                    {formatDisplayDate(data.data) || '-'}
                  </span>
                </div>
              </div>

              {/* Coluna 2: VENDEDOR, PROJETO, RESPONSÁVEL (x = 44.2%) */}
              <div
                className="absolute flex flex-col justify-between text-[3.2px] sm:text-[4px] md:text-[4.8px] leading-none whitespace-nowrap"
                style={{
                  left: '44.2%',
                  top: '90.3%',
                  height: '5.7%',
                }}
              >
                <div className="flex items-center gap-[2px] truncate max-w-[125px]">
                  <span className="font-bold text-[#3A3A3A]">VENDEDOR:</span>
                  <span className="font-normal text-[#222222]">{data.vendedor || '-'}</span>
                </div>
                <div className="flex items-center gap-[2px] truncate max-w-[125px]">
                  <span className="font-bold text-[#3A3A3A]">PROJETO:</span>
                  <span className="font-normal text-[#222222]">{data.projeto || '-'}</span>
                </div>
                <div className="flex items-center gap-[2px] truncate max-w-[125px]">
                  <span className="font-bold text-[#3A3A3A]">RESPONSÁVEL:</span>
                  <span className="font-normal text-[#222222]">{data.responsavel || '-'}</span>
                </div>
              </div>

              {/* Caixa Antracite de Copyright (#3A3A3A) */}
              <div
                className="absolute bg-[#3A3A3A] rounded-[2px] flex flex-col justify-center px-[3px] py-[1.5px] text-[#FFFFFF] leading-[1.15]"
                style={{
                  left: '71.0%',
                  top: '90.3%',
                  width: '19.5%',
                  height: '5.6%',
                  fontSize: 'clamp(2.4px, 0.7cqi, 3.8px)',
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
