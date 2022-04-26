export function epochFromDate(date?: Date): number {
  const ms: number = date ? date.getTime() : Date.now()
  return Math.round(ms / 1e3)
}

export function epochToDate(epoch: number): Date {
  return new Date(epoch * 1e3)
}
