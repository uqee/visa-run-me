export function jsonStringifyBigints(source: unknown): string {
  return JSON.stringify(source, (key: string, value: unknown) => {
    return typeof value === 'bigint' ? value.toString() : value
  })
}
