export type AllOrNone<T> = T | { [K in keyof T]?: never }
export type ElementOf<TArray extends unknown[]> = TArray extends Array<infer TElement>
  ? TElement
  : never
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] }
