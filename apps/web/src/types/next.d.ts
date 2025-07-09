// Next.js component type declarations
import { ComponentType, ReactNode } from 'react'

declare module 'next/link' {
  export interface LinkProps {
    href: string | { pathname?: string; query?: any; hash?: string }
    as?: string | { pathname?: string; query?: any; hash?: string }
    replace?: boolean
    scroll?: boolean
    shallow?: boolean
    passHref?: boolean
    prefetch?: boolean
    locale?: string | false
    legacyBehavior?: boolean
    children?: ReactNode
  }
  
  const Link: ComponentType<LinkProps>
  export default Link
}

declare module 'next/image' {
  export interface ImageProps {
    src: string | { src: string; height: number; width: number }
    alt: string
    width?: number | string
    height?: number | string
    fill?: boolean
    loader?: any
    quality?: number | string
    priority?: boolean
    loading?: 'lazy' | 'eager'
    placeholder?: 'blur' | 'empty'
    blurDataURL?: string
    unoptimized?: boolean
    onLoad?: (event: any) => void
    onError?: (event: any) => void
    sizes?: string
    style?: React.CSSProperties
    className?: string
  }
  
  const Image: ComponentType<ImageProps>
  export default Image
}