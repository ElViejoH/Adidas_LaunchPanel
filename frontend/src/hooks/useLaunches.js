import { useCallback, useEffect, useMemo, useState } from 'react'
import { launchService } from '../services/launchService'

export function useLaunches(filters = {}) {
  const requestKey = useMemo(() => JSON.stringify(filters), [filters])
  const [refreshKey, setRefreshKey] = useState(0)
  const [state, setState] = useState({
    launches: [],
    meta: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const activeFilters = JSON.parse(requestKey)

    async function load() {
      setState((current) => ({ ...current, isLoading: true, error: null }))
      try {
        const result = await launchService.getAll(activeFilters, { signal: controller.signal })
        setState({ ...result, isLoading: false, error: null })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setState((current) => ({ ...current, isLoading: false, error }))
        }
      }
    }

    load()
    return () => controller.abort()
  }, [refreshKey, requestKey])

  const reload = useCallback(() => setRefreshKey((key) => key + 1), [])
  return { ...state, reload }
}
