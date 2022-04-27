import { uid } from 'uid'
import { Ydb as Sdk } from 'ydb-sdk-lite'

import { epochFromDate } from '../utils'
import { Cache, Person, Place } from './ydb-tables'

type SdkExecuteDataQueryReturnType<T = Record<string, unknown>> = Array<T[] | never>

interface YdbArgs {
  _limit?: number
  _offset?: number
}

class Ydb {
  private static readonly _limit: number = 3
  private static readonly _offset: number = 0
  private static str(value: string | undefined): string {
    return value ? `'${value}'` : 'null'
  }

  private accessToken: string | undefined
  private debug: boolean | undefined
  private sdk: Sdk | undefined

  private async _execute<T>(request: string): Promise<SdkExecuteDataQueryReturnType<T>> {
    try {
      if (this.debug) console.log('YDB : request', JSON.stringify(request))
      const response = await this.sdk!.executeDataQuery(request)
      if (this.debug) console.log('YDB : response', JSON.stringify(response))
      return response as SdkExecuteDataQueryReturnType<T>
    } catch (error) {
      if (this.debug) console.log('YDB : error', error)
      throw error
    }
  }

  public _setup(dbName: string, accessToken: string, debug: boolean): void {
    if (accessToken !== this.accessToken) {
      this.accessToken = accessToken
      this.sdk = undefined
    }
    if (this.sdk === undefined) {
      this.sdk = new Sdk({ dbName, iamToken: this.accessToken })
    }
    this.debug = debug
  }

  //

  public async cachesDelete(
    args: YdbArgs & Pick<Cache, 'key'>, //
  ): Promise<void> {
    const { key } = args
    // prettier-ignore
    await this._execute(
      `delete from caches where key == '${key}'`,
    )
  }

  public async cachesReplace(
    args: YdbArgs & Pick<Cache, 'key' | 'value'>, //
  ): Promise<void> {
    const { key, value } = args
    // prettier-ignore
    await this._execute(`
      replace into caches (key, value, created)
      values ('${key}', '${value}', ${epochFromDate()})
    `)
  }

  public async cachesSelectByKey(
    args: YdbArgs & Pick<Cache, 'key'>, //
  ): Promise<Cache | undefined> {
    const { key } = args
    // prettier-ignore
    return (
      await this._execute<Cache>(
        `select * from caches where key == '${key}'`,
      )
    )[0]?.[0]
  }

  //

  public async countriesSelectByTgid(
    args: YdbArgs & Pick<Place, 'tgid'>, //
  ): Promise<Place[]> {
    const { _limit = Ydb._limit, _offset = Ydb._offset, tgid } = args
    // prettier-ignore
    return (
      await this._execute<Place>(`
        select * from countries where tgid == '${tgid}' and deleted is null
        order by name limit ${_limit} offset ${_offset}
      `)
    )[0]
  }

  //

  public async personsInsert(
    args: YdbArgs & Pick<Person, 'firstname' | 'lastname' | 'tgid' | 'tgname'>, //
  ): Promise<void> {
    const { firstname, lastname, tgid, tgname } = args
    const id: string = uid()
    // prettier-ignore
    await this._execute(`
      insert into persons (
        _feedbacksCount, _feedbacksSum, firstname, lastname, tgname,
        created, deleted, id, tgid
      ) values (
        0, 0, '${firstname}', ${Ydb.str(lastname)}, '${tgid}', ${Ydb.str(tgname)},
        ${epochFromDate()}, null, '${id}', '${id}'
      )
    `)
  }

  public async personsSelectByTgid(
    args: YdbArgs & Pick<Person, 'tgid'>, //
  ): Promise<Person | undefined> {
    const { tgid } = args
    // prettier-ignore
    return (
      await this._execute<Person>(
        `select * from persons where tgid == '${tgid}'`,
      )
    )[0]?.[0]
  }

  public async personsUpdate(
    args: YdbArgs & Pick<Person, 'firstname' | 'id' | 'lastname' | 'tgname'>, //
  ): Promise<void> {
    const { id, firstname, lastname, tgname } = args
    // prettier-ignore
    await this._execute(`
      update
        persons
      set
        firstname = '${firstname}',
        lastname = ${Ydb.str(lastname)},
        tgname = ${Ydb.str(tgname)}
      where
        id == '${id}'
    `)
  }

  //

  public async placesDelete(
    args: YdbArgs & Pick<Place, 'id'>, //
  ): Promise<unknown> {
    const { id } = args
    // prettier-ignore
    return (
      await this._execute<Place>(
        `update places set deleted = ${epochFromDate()} where id == '${id}'`,
      )
    )
  }

  public async placesSelectByTgid(
    args: YdbArgs & Pick<Place, 'tgid'>, //
  ): Promise<Place[]> {
    const { _limit = Ydb._limit, _offset = Ydb._offset, tgid } = args
    // prettier-ignore
    return (
      await this._execute<Place>(`
        select * from places where tgid == '${tgid}' and deleted is null
        order by name limit ${_limit} offset ${_offset}
      `)
    )[0]
  }
}

export const ydb: Ydb = new Ydb()
