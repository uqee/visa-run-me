// javascript timestamp = milliseconds
// uint32 epoch = seconds

export function epochFromTimestamp(timestamp?: number): number {
  const ms: number = timestamp ?? Date.now()
  return Math.round(ms / 1e3)
}

export function epochToTimestamp(epoch: number): number {
  return epoch * 1e3
}
