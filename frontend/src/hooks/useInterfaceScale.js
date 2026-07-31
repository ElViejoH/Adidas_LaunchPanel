import { useLayoutEffect } from 'react'

export function useInterfaceScale(percentage, compactPercentage = percentage) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const previousFontSize = root.style.fontSize
    const compactViewport = window.matchMedia('(max-width: 359px)')
    const applyScale = () => {
      root.style.fontSize = `${compactViewport.matches ? compactPercentage : percentage}%`
    }

    applyScale()
    compactViewport.addEventListener('change', applyScale)

    return () => {
      compactViewport.removeEventListener('change', applyScale)
      root.style.fontSize = previousFontSize
    }
  }, [compactPercentage, percentage])
}
