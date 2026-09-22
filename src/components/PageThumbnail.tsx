import React from 'react'
import CorteplanLogo from '@/components/CorteplanLogo'
import { formatDisplayDate, ADDRESS_TEXT } from '@/lib/pdf/generator'
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
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border border-[#DCDCDC] rounded-xl shadow-xs overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#F2612A]/60 hover:scale-[1.01] ${className}`}
    >
      {/* 297 x 210 aspect ratio container (approx 1.414:1) */}
      <div className="relative w-full aspect-[297/210] bg-white p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden select-none">
        {type === 'cover' ? (
          // Capa: apenas o logo da Corteplan centralizado
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="scale-75 sm:scale-90 md:scale-100 transform origin-center">
              <CorteplanLogo variant="cover" />
            </div>
          </div>
        ) : (
          // Páginas com imagem + endereço topo + rodapé
          <>
            {/* Top address bar */}
            <div className="w-full text-center py-0.5 border-b border-transparent">
              <span className="text-[5.5px] sm:text-[7px] text-[#8E8E8E] font-medium truncate block tracking-tight">
                {ADDRESS_TEXT}
              </span>
            </div>

            {/* Usable image area with light gray hairline border */}
            <div className="flex-1 w-full my-1 border border-[#DCDCDC] rounded-xs overflow-hidden bg-[#F7F7F5] relative flex items-center justify-center">
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

            {/* Standard Footer */}
            <div className="w-full pt-1 border-t border-[#DCDCDC] flex items-center justify-between text-[5px] sm:text-[6.5px] text-[#1F1F1F]">
              {/* Block 1: Logo */}
              <div className="shrink-0 scale-75 origin-left">
                <CorteplanLogo variant="footer" />
              </div>

              {/* Block 2: Orange bar + 3 lines */}
              <div className="flex items-center gap-1 border-l-2 border-[#F2612A] pl-1 max-w-[28%]">
                <div className="flex flex-col leading-tight truncate">
                  <span className="truncate">
                    <strong className="text-[#6B6B6B] font-normal">Cli: </strong>
                    {data.cliente || '-'}
                  </span>
                  <span className="truncate">
                    <strong className="text-[#6B6B6B] font-normal">Mod: </strong>
                    {data.modelo || '-'}
                  </span>
                  <span className="truncate">
                    <strong className="text-[#6B6B6B] font-normal">Data: </strong>
                    {formatDisplayDate(data.data) || '-'}
                  </span>
                </div>
              </div>

              {/* Block 3: 3 lines */}
              <div className="flex flex-col leading-tight max-w-[28%] truncate">
                <span className="truncate">
                  <strong className="text-[#6B6B6B] font-normal">Vend: </strong>
                  {data.vendedor || '-'}
                </span>
                <span className="truncate">
                  <strong className="text-[#6B6B6B] font-normal">Proj: </strong>
                  {data.projeto || '-'}
                </span>
                <span className="truncate">
                  <strong className="text-[#6B6B6B] font-normal">Resp: </strong>
                  {data.responsavel || '-'}
                </span>
              </div>

              {/* Block 4: Copyright small box + Big Page Number */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="hidden sm:block border border-[#DCDCDC] px-1 py-0.5 text-[4.5px] leading-tight text-[#8A8A8A] max-w-[90px]">
                  Corteplan Móveis. Documento protegido por direitos autorais.
                </div>
                <div className="text-[13px] sm:text-[16px] font-black tracking-tight text-[#1F1F1F] leading-none">
                  {pageNumStr}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Label footer of card */}
      <div className="px-3 py-1.5 bg-[#F7F7F5] border-t border-[#E5E5E5] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1F1F1F]">Página {pageNumStr}</span>
        <span className="text-[11px] text-[#6B6B6B] font-medium">{title}</span>
      </div>
    </div>
  )
}
