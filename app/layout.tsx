// import { GeistSans } from 'geist/font/sans'
// import { GeistMono } from 'geist/font/mono'
import { inter, raleway, lato } from '@/components/ui/fonts';

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
// import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import '@near-wallet-selector/modal-ui/styles.css'


export const metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : undefined,
  title: {
    default: 'Next.js AI Chatbot',
    template: `%s - Next.js AI Chatbot`
  },
  description: 'An AI-powered chatbot template built with Next.js and Vercel.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}
interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          inter.className,
          raleway.className,
          // lato.className
        )}
      >
        {/* <Toaster position="top-center" /> */}
        
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
            <Toaster />
              {/* <Header /> */}
              <main className="flex flex-col flex-1">{children}</main>
            </div>
            {/* <TailwindIndicator /> */}
          </Providers>

      </body>
    </html>
  )
}