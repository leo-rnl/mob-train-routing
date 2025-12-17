const STORAGE_KEY = 'last_analytic_code'

/**
 * Composable for managing analytic code persistence in localStorage.
 */
export function useAnalyticCode() {
  function load(): string {
    return localStorage.getItem(STORAGE_KEY) || ''
  }

  function save(code: string): void {
    localStorage.setItem(STORAGE_KEY, code)
  }

  function clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    load,
    save,
    clear,
  }
}
