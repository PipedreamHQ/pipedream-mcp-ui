"use client"

import * as React from "react"
import { ChartConfig } from "./chart"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

interface ChartStylesProps {
  id: string
  config: ChartConfig
}

/**
 * Safe implementation of chart styles without using dangerouslySetInnerHTML
 */
export const ChartStyles: React.FC<ChartStylesProps> = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  const [styleElement, setStyleElement] = React.useState<HTMLStyleElement | null>(null)
  
  React.useEffect(() => {
    if (!colorConfig.length) return

    // Create CSS text for the style element
    const cssText = Object.entries(THEMES)
      .map(
        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    // Sanitize color value to prevent XSS
    const sanitizedColor = color ? color.replace(/[^a-zA-Z0-9#(),. %-]/g, '') : null
    return sanitizedColor ? `  --color-${key}: ${sanitizedColor};` : null
  })
  .filter(Boolean)
  .join("\n")}
}
`
      )
      .join("\n")

    // Create a style element
    const style = document.createElement('style')
    
    // Add nonce if available for CSP compliance
    const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
    if (nonce) {
      style.setAttribute('nonce', nonce)
    }
    
    // Set the CSS content
    style.textContent = cssText
    
    // Append to document head
    document.head.appendChild(style)
    
    // Store reference to remove on cleanup
    setStyleElement(style)
    
    // Clean up the style element when the component unmounts
    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [id, colorConfig])

  return null
}