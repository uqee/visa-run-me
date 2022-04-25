import { Ydb } from 'ydb-sdk-lite'

let debug_: boolean | undefined
let iamToken: string | undefined
let ydb: Ydb | undefined

export async function ydbExecute<T extends Array<Array<Record<string, unknown>>>>(
  query: string,
): Promise<T> {
  try {
    const result = await ydb!.executeDataQuery(query)
    return result as T
  } catch (error) {
    if (debug_) console.log(query, '\n', error)
    throw error
  }
}

export function ydbSetup(dbName: string, accessToken: string, debug: boolean): Ydb {
  if (accessToken !== iamToken) {
    iamToken = accessToken
    ydb = undefined
  }
  if (ydb === undefined) {
    ydb = new Ydb({ dbName, iamToken })
  }
  debug_ = debug
  return ydb
}
