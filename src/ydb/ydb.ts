import { Ydb as Sdk } from 'ydb-sdk-lite'

type SdkExecuteDataQueryReturnType<T = Record<string, unknown>> = Array<T[] | never>

class Ydb {
  private accessToken: string | undefined
  private debug: boolean | undefined
  private sdk: Sdk | undefined

  public async execute<T>(query: string): Promise<SdkExecuteDataQueryReturnType<T>> {
    try {
      const result = await this.sdk!.executeDataQuery(query)
      return result as SdkExecuteDataQueryReturnType<T>
    } catch (error) {
      if (this.debug) console.log(query, '\n', error)
      throw error
    }
  }

  public setup(dbName: string, accessToken: string, debug: boolean): void {
    if (accessToken !== this.accessToken) {
      this.accessToken = accessToken
      this.sdk = undefined
    }
    if (this.sdk === undefined) {
      this.sdk = new Sdk({ dbName, iamToken: this.accessToken })
    }
    this.debug = debug
  }
}

export const ydb: Ydb = new Ydb()
