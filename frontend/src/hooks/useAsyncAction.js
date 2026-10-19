import { useState } from 'react'

// Wraps an async call with pending/error state. Resolves to undefined on error.
export function useAsyncAction(fn) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function run(...args) {
    setPending(true)
    setError(null)
    try {
      return await fn(...args)
    } catch (err) {
      setError(err.message)
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error }
}
