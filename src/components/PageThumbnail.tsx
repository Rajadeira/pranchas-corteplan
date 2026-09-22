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
      <div className="relative w-full aspect-[297/210] bg-white p-[2.5%] flex flex-col justify-between overflow-hidden select-none">
        {type === 'cover' ? (
          // Capa: apenas o logo oficial da Corteplan centralizado
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-40 sm:w-48 md:w-56 flex items-center justify-center">
              <CorteplanLogo variant="cover" />
            </div>
          </div>
        ) : (
          // Páginas com imagem + endereço topo + rodapé
          <>
            {/* Top address bar fixo no topo acima da imagem */}
            <div className="absolute top-[0.6%] left-0 right-0 text-center pointer-events-none z-10">
              <span className="text-[5px] sm:text-[6px] text-[#8E8E8E] font-medium tracking-wide truncate block px-2">
                {ADDRESS_TEXT}
              </span>
            </div>

            {/* Usable image area: da margem superior (~2.5%) até o topo do rodapé (ocupando ~85% da altura da página) */}
            <div className="w-full flex-1 min-h-0 border border-[#DCDCDC] overflow-hidden bg-[#F7F7F5] relative flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2 text-[#8E8E8E]">
                  <span className="text-[8px] sm:text-[10px] font-semibold text-[#6B6B6B]">
                    {title}
                  </span>
                  <span className="text-[6px] sm:text-[7.5px]">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Standard Footer faithful to Corteplan reference board (~15% da altura da página) */}
            <div className="w-full h-[15%] shrink-0 border-t border-[#DCDCDC] flex items-center relative text-[4px] sm:text-[5px] text-[#1F1F1F]">
              {/* Bloco 1: Logo Oficial Corteplan (~13-14% da largura) */}
              <div className="shrink-0 flex items-center w-[13.5%] h-full py-[1%]">
                <CorteplanLogo variant="footer" className="w-full max-h-[85%] object-contain" />
              </div>

              {/* Bloco 2: Barra vertical laranja + 3 linhas (CLIENTE, MODELO, DATA) */}
              <div className="flex items-center gap-[3px] sm:gap-1.5 h-full pl-[2%] pr-[1%]">
                <div className="w-[2px] sm:w-[3px] h-[72%] bg-[#E08A2E] shrink-0 rounded-none" />
                <div className="flex flex-col justify-center leading-[1.25] whitespace-nowrap">
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
              <div className="absolute left-[44%] flex flex-col justify-center leading-[1.25] whitespace-nowrap">
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
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2 h-full py-[1%]">
                <div className="bg-[#3A3A3A] text-white px-1 sm:px-1.5 py-0.5 rounded-[2px] text-[3.2px] sm:text-[4px] leading-[1.25] tracking-tight font-normal text-left max-w-[100px] sm:max-w-[125px]">
                  <p className="truncate">{COPYRIGHT_LINE_1}</p>
                  <p className="truncate">{COPYRIGHT_LINE_2}</p>
                  <p className="truncate">{COPYRIGHT_LINE_3}</p>
                </div>
                <div className="text-[13px] sm:text-[18px] font-bold text-[#737373] leading-none text-right font-sans min-w-[16px]">
                  {pageNumStr}
                </div>
              </div>
            </div>
          </>
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
