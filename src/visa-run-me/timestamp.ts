export function timestampFromDate(date?: Date): number {
  const ms: number = date ? date.getTime() : Date.now()
  return Math.round(ms / 1e3)
}

export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1e3)
}
