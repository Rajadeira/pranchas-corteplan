import React from 'react'

interface CorteplanLogoProps {
  className?: string
  variant?: 'full' | 'compact' | 'footer' | 'cover'
}

export const CorteplanLogo: React.FC<CorteplanLogoProps> = ({
  className = '',
  variant = 'full',
}) => {
  if (variant === 'cover') {
    return (
      <div
        className={`flex flex-col items-center justify-center select-none text-center ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-4 h-12 bg-[#F2612A] rounded-sm" />
          <div className="tracking-[0.22em] text-4xl sm:text-5xl font-extrabold text-[#1F1F1F] uppercase font-sans">
            CORTEPLAN
          </div>
        </div>
        <div className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#6B6B6B] mt-2 font-medium">
          Móveis Especiais &amp; PDV
        </div>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="w-1.5 h-6 bg-[#F2612A] rounded-xs" />
        <div className="flex flex-col">
          <span className="tracking-[0.18em] text-[15px] leading-none font-black text-[#1F1F1F] uppercase font-sans">
            CORTEPLAN
          </span>
          <span className="text-[7px] tracking-[0.24em] text-[#7A7A7A] uppercase font-semibold leading-tight">
            Móveis Especiais
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 select-none ${className}`}>
        <div className="w-1.5 h-5 bg-[#F2612A] rounded-xs" />
        <span className="tracking-[0.16em] text-base font-extrabold text-[#1F1F1F] uppercase font-sans">
          CORTEPLAN
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-2 h-7 bg-[#F2612A] rounded-[2px]" />
      <div className="flex flex-col">
        <span className="tracking-[0.2em] text-lg font-black text-[#1F1F1F] uppercase font-sans leading-none">
          CORTEPLAN
        </span>
        <span className="text-[8px] tracking-[0.28em] text-[#6B6B6B] uppercase font-semibold mt-0.5">
          Móveis Especiais
        </span>
      </div>
    </div>
  )
}

export default CorteplanLogo
