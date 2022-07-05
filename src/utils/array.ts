export const arrayDeduplicate = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const arrayToObject =
  <TValue extends object, TKey extends keyof TValue>(key: TKey) =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (values: TValue[]): Record<TValue[TKey], TValue> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: Record<TValue[TKey], TValue> = {} as Record<TValue[TKey], TValue>
    for (const value of values) result[value[key]] = value
    return result
  }
