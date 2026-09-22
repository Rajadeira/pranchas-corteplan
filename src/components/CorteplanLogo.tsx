import React from 'react'
import corteplanLogoImg from '@/assets/logo-novo-corteplan-ffd51.jpg'

export { corteplanLogoImg }

interface CorteplanLogoProps {
  className?: string
  variant?: 'full' | 'compact' | 'footer' | 'cover'
  alt?: string
}

export const CorteplanLogo: React.FC<CorteplanLogoProps> = ({
  className = '',
  variant = 'full',
  alt = 'CORTEPLAN Móveis Especiais',
}) => {
  if (variant === 'cover') {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img
          src={corteplanLogoImg}
          alt={alt}
          className="w-auto h-24 sm:h-32 md:h-40 max-w-[85vw] object-contain drop-shadow-xs"
        />
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src={corteplanLogoImg}
          alt={alt}
          className="h-7 sm:h-8 w-auto max-w-[130px] sm:max-w-[160px] object-contain"
        />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img src={corteplanLogoImg} alt={alt} className="h-7 sm:h-8 w-auto object-contain" />
      </div>
    )
  }

  // variant === 'full' (header, auth pages, default)
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img src={corteplanLogoImg} alt={alt} className="h-8 sm:h-9 w-auto object-contain" />
    </div>
  )
}

export default CorteplanLogo
