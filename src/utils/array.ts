export const arrayDeduplicate = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}
