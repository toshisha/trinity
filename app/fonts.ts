import { Inter } from "next/font/google"
import localFont from "next/font/local"

// Inter as fallback
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

// Custom font - directly load your specific font file
export const helveticaFont = localFont({
  src: "../public/fonts/HelveticaNeueBlack.otf",
  display: "swap",
  fallback: ["Inter", "system-ui", "arial"],
})

// Export the custom font as primary
export const primaryFont = helveticaFont
 