'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { WalletSelectorContextProvider } from '@/components/contexts/WalletSelectorContext'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <WalletSelectorContextProvider>
      <NextThemesProvider {...props}>
        <TooltipProvider>{children}</TooltipProvider>
      </NextThemesProvider>
    </WalletSelectorContextProvider>
  )
}
