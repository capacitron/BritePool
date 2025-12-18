import type { Metadata } from 'next'
import { Inter, Spectral } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const spectral = Spectral({ 
  weight: ['400', '600', '700'], 
  subsets: ['latin'], 
  variable: '--font-serif' 
})

export const metadata: Metadata = {
  title: 'BRITE POOL Ministerium of Empowerment',
  description: 'Building sovereign futures through empowered communities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spectral.variable}`}>
        {children}
      </body>
    </html>
  )
}
