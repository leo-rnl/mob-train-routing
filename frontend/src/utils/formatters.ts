/**
 * Format a distance value to 2 decimal places with unit
 * @param km - Distance in kilometers
 * @returns Formatted string (e.g., "63.48 km")
 */
export function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`
}

/**
 * Format a distance value to 2 decimal places without unit
 * @param km - Distance in kilometers
 * @returns Formatted string (e.g., "63.48")
 */
export function formatDistanceValue(km: number): string {
  return km.toFixed(2)
}

/**
 * Format a Date object to API format (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted date string or undefined if null
 */
export function formatDateApi(date: Date | null): string | undefined {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
