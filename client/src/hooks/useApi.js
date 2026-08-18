import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic async data-fetching hook.
 * Returns { data, loading, error, refetch, setData }.
 */
export function useApi(asyncFn, options = {}) {
  const { immediate = true, deps = [] } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(immediate))
  const [error, setError] = useState(null)
  const fnRef = useRef(asyncFn)

  useEffect(() => {
    fnRef.current = asyncFn
  }, [asyncFn])

  const refetch = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch, setData }
}

export default useApi
