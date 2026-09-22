import React from 'react'
import CorteplanLogo from '@/components/CorteplanLogo'
import {
  formatDisplayDate,
  ADDRESS_TEXT,
  COPYRIGHT_LINE_1,
  COPYRIGHT_LINE_2,
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
      <div className="relative w-full aspect-[297/210] bg-white p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden select-none">
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
            {/* Top address bar */}
            <div className="w-full text-center py-0.5 border-b border-transparent">
              <span className="text-[5.5px] sm:text-[6.5px] text-[#8E8E8E] font-medium truncate block tracking-tight">
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

            {/* Standard Footer faithful to Corteplan reference board */}
            <div className="w-full pt-1.5 border-t border-[#DCDCDC] flex items-center justify-between text-[4.5px] sm:text-[5.5px] text-[#1F1F1F] gap-1 sm:gap-2">
              {/* Block 1: Logo Oficial (proporção aprox. 2:1) */}
              <div className="shrink-0 flex items-center w-[16%] max-w-[62px]">
                <CorteplanLogo variant="footer" className="w-full max-h-5 object-contain" />
              </div>

              {/* Block 2: Orange vertical bar + 3 lines (CLIENTE:, MODELO:, DATA:) */}
              <div className="flex items-stretch gap-1 sm:gap-1.5 border-l-2 border-[#E08A2E] pl-1 sm:pl-1.5 w-[25%] shrink-0">
                <div className="flex flex-col justify-center leading-tight truncate py-0.5">
                  <span className="truncate">
                    <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                      CLIENTE:{' '}
                    </span>
                    <span className="font-semibold text-[#1F1F1F]">{data.cliente || '-'}</span>
                  </span>
                  <span className="truncate mt-0.5">
                    <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                      MODELO:{' '}
                    </span>
                    <span className="font-semibold text-[#1F1F1F]">{data.modelo || '-'}</span>
                  </span>
                  <span className="truncate mt-0.5">
                    <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                      DATA:{' '}
                    </span>
                    <span className="font-semibold text-[#1F1F1F]">
                      {formatDisplayDate(data.data) || '-'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Block 3: 3 lines (VENDEDOR:, PROJETO:, RESPONSÁVEL:) */}
              <div className="flex flex-col justify-center leading-tight w-[27%] shrink-0 truncate py-0.5">
                <span className="truncate">
                  <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                    VENDEDOR:{' '}
                  </span>
                  <span className="font-semibold text-[#1F1F1F]">{data.vendedor || '-'}</span>
                </span>
                <span className="truncate mt-0.5">
                  <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                    PROJETO:{' '}
                  </span>
                  <span className="font-semibold text-[#1F1F1F]">{data.projeto || '-'}</span>
                </span>
                <span className="truncate mt-0.5">
                  <span className="text-[#6B6B6B] font-bold text-[4px] sm:text-[5px]">
                    RESPONSÁVEL:{' '}
                  </span>
                  <span className="font-semibold text-[#1F1F1F]">{data.responsavel || '-'}</span>
                </span>
              </div>

              {/* Block 4: Copyright box + Big Page Number */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                <div className="hidden xs:block sm:block bg-[#3A3A3A] text-white px-1 sm:px-1.5 py-0.5 text-[3.8px] sm:text-[4.5px] leading-tight rounded-[1px] max-w-[85px] sm:max-w-[110px]">
                  <p className="truncate font-normal">{COPYRIGHT_LINE_1}</p>
                  <p className="truncate font-normal">{COPYRIGHT_LINE_2}</p>
                </div>
                <div className="text-[13px] sm:text-[16px] font-black tracking-tight text-[#4A4A4A] leading-none min-w-[18px] text-right font-sans">
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
