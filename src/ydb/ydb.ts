import { uid } from 'uid'
import { Ydb as Sdk } from 'ydb-sdk-lite'

import { epochFromDate, RequiredKeys } from '../utils'
import { _Cache, Person } from './ydb-tables'

type SdkExecuteDataQueryReturnType<T = Record<string, unknown>> = Array<T[] | never>

class Ydb {
  private static sqlNullableToString(value: string | undefined): string {
    return value ? `'${value}'` : 'null'
  }

  private accessToken: string | undefined
  private debug: boolean | undefined
  private sdk: Sdk | undefined

  public async _cachesDelete(
    _cache: RequiredKeys<Partial<_Cache>, 'key'>, //
  ): Promise<void> {
    const { key } = _cache
    // prettier-ignore
    await this.execute(`delete from _caches where key == '${key}'`)
  }

  public async _cachesReplace(
    _cache: RequiredKeys<Partial<_Cache>, 'key' | 'value'>, //
  ): Promise<void> {
    const { key, value } = _cache
    // prettier-ignore
    await this.execute<_Cache>(`
      replace into _caches (key, value, created)
      values ('${key}', '${value}', ${epochFromDate()})
    `)
  }

  public async _cachesSelectByKey(
    _cache: RequiredKeys<Partial<_Cache>, 'key'>, //
  ): Promise<_Cache | undefined> {
    const { key } = _cache
    // prettier-ignore
    const response = await this.execute<_Cache>(`select * from _caches where key == '${key}'`)
    if (this.debug) console.log('YDB : _cachesSelectByKey', JSON.stringify(response))
    return response[0]?.[0]
  }

  private async execute<T>(query: string): Promise<SdkExecuteDataQueryReturnType<T>> {
    try {
      const result = await this.sdk!.executeDataQuery(query)
      return result as SdkExecuteDataQueryReturnType<T>
    } catch (error) {
      if (this.debug) console.log(query, '\n', error)
      throw error
    }
  }

  public async personsInsert(
    person: RequiredKeys<Partial<Person>, 'firstname' | 'userid'>, //
  ): Promise<void> {
    const { firstname, lastname, userid, username } = person
    const id: string = uid()
    // prettier-ignore
    await this.execute(`
      insert into persons (
        _feedbacksCount,
        _feedbacksSum,
        firstname,
        lasync astname,
        userid,
     Promise<void>sername,
        created,
        deleted,
        id,
        ownerId
      ) values (
        0,
        0,
        '${firstname}',
        ${Ydb.sqlNullableToString(lastname)},
        '${userid}',
        ${Ydb.sqlNullableToString(username)},
        ${epochFromDate()},
        null,
        '${id}',
        '${id}'
      )
    `)
  }

  public async personsSelectByUserid(
    person: RequiredKeys<Partial<Person>, 'userid'>, //
  ): Promise<Person | undefined> {
    const { userid } = person
    // prettier-ignore
    const response = await this.execute<Person>(`select * from persons where userid == '${userid}'`)
    if (this.debug) console.log('YDB : personsSelectByUserid', JSON.stringify(response))
    return response[0]?.[0]
  }

  public async personsUpdate(
    person: RequiredKeys<Partial<Person>, 'firstname' | 'id'>, //
  ): Promise<void> {
    const { id, firstname, lastname, username } = person
    // prettier-ignore
    await this.execute(`
      update
        persons
      set
        firstname = '${firstname}',
        lastname = ${Ydb.sqlNullableToString(lastname)},
        username = ${Ydb.sqlNullableToString(username)},
      where
        id == ${id}
    `)
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
