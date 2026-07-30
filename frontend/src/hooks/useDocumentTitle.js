import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Adidas Launch Panel` : 'Adidas Launch Panel'
  }, [title])
}
