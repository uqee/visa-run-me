import { Ydb as Sdk } from 'ydb-sdk-lite'

import { epochFromTimestamp } from '../utils'
import { Cache, Need, Person, Place, Trip, TripPlace } from './ydb-tables'

//

type SdkExecuteDataQueryReturnType<T = Record<string, unknown>> = Array<T[] | never>

export interface YdbArgs {
  _limit: number
  _offset: number
}

//

export type NeedsSelectItem = Need & {
  personTgname: Person['tgname']
  placeName: Place['name']
}

type TripsInsertItem = Pick<Trip, 'capacity' | 'day' | 'personId' | 'tgid'> & {
  tripPlaces: Array<{
    minprice: TripPlace['minprice']
    placeId: Place['id']
  }>
}

export type TripsSelectItem = Trip & {
  personTgname: Person['tgname']
  tripPlaces: Array<{
    minprice: TripPlace['minprice']
    placeName: Place['name']
  }>
}

type TripsSelectRow = Trip & {
  personTgname: Person['tgname']
  placeName: Place['name']
  tripPlaceMinprice: TripPlace['minprice']
}

const tripSelectRowsToTripSelectDescrs = (rows: TripsSelectRow[]): TripsSelectItem[] => {
  const items: TripsSelectItem[] = []
  for (const row of rows) {
    const last: TripsSelectItem | undefined = items[items.length - 1]
    if (row.id === last?.id) {
      last.tripPlaces.push({
        minprice: row.tripPlaceMinprice,
        placeName: row.placeName,
      })
    } else {
      items.push({
        ...row,
        tripPlaces: [
          {
            minprice: row.tripPlaceMinprice,
            placeName: row.placeName,
          },
        ],
      })
    }
  }
  return items
}

//

class Ydb {
  private static str(value: string | undefined): string {
    return value ? `'${value}'` : 'null'
  }

  private static stringify(object: unknown): string {
    return JSON.stringify(object, (_key, value) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      typeof value === 'bigint' ? value.toString() : value,
    )
  }

  private accessToken: string | undefined
  private debug: boolean | undefined
  private sdk: Sdk | undefined

  private async _execute<T>(request: string): Promise<SdkExecuteDataQueryReturnType<T>> {
    try {
      if (this.debug) console.log('YDB : request', Ydb.stringify(request))
      const response = await this.sdk!.executeDataQuery(request)
      if (this.debug) console.log('YDB : response', Ydb.stringify(response))
      return response as SdkExecuteDataQueryReturnType<T>
    } catch (error) {
      if (this.debug) console.error('YDB : error', error)
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
    args: Pick<Cache, 'key'>, //
  ): Promise<void> {
    const { key } = args
    await this._execute(`
      delete from caches
      where key == '${key}'
    `)
  }

  public async cachesReplace(
    args: Pick<Cache, 'key' | 'value'>, //
  ): Promise<void> {
    const { key, value } = args
    await this._execute(`
      replace into caches (key, value, created)
      values ('${key}', '${value}', ${epochFromTimestamp()})
    `)
  }

  public async cachesSelectByKey(
    args: Pick<Cache, 'key'>, //
  ): Promise<Cache | undefined> {
    const { key } = args
    return (
      await this._execute<Cache>(`
        select *
        from caches
        where key == '${key}'
      `)
    )[0]?.[0]
  }

  //

  public async needsDelete(
    args: Pick<Need, 'id'>, //
  ): Promise<void> {
    const { id } = args
    await this._execute(`
      update needs
      set deleted = ${epochFromTimestamp()}
      where id == ${id}
    `)
  }

  public async needsInsert(
    args: Pick<Need, 'maxday' | 'maxprice' | 'personId' | 'placeId' | 'tgid'>, //
  ): Promise<void> {
    const { maxday, maxprice, personId, placeId, tgid } = args
    await this._execute(`
      $id = select cast((max(id) ?? 0) + 1 as uint32) from needs with xlock;
      insert into needs (
        maxday, maxprice, personId, placeId,
        created, deleted, id, tgid
      ) values (
        ${maxday}, ${maxprice}, ${personId}, ${placeId},
        ${epochFromTimestamp()}, null, $id, ${tgid}
      )
    `)
  }

  public async needsSelect(
    args: YdbArgs & Partial<Pick<Need, 'tgid'>>, //
  ): Promise<NeedsSelectItem[]> {
    const { _limit, _offset, tgid } = args
    return (
      await this._execute<NeedsSelectItem>(`
        select
          n.*,
          pe.tgname as personTgname,
          pl.name as placeName
        from
          needs as n
          left join persons as pe on pe.tgid = n.tgid
          left join places as pl on pl.id = n.placeId
        where
          n.deleted is null
          and n.maxday > ${epochFromTimestamp()}
          ${tgid ? `and n.tgid == ${tgid}` : ''}
        order by
          maxday asc,
          created desc
        limit ${_limit}
        offset ${_offset}
      `)
    )[0]
  }

  public async needsSelectById(
    args: Pick<Need, 'id'>, //
  ): Promise<NeedsSelectItem | undefined> {
    const { id } = args
    return (
      await this._execute<NeedsSelectItem | undefined>(`
        select
          n.*,
          pe.tgname as personTgname,
          pl.name as placeName
        from
          needs as n
          left join persons as pe on pe.tgid = n.tgid
          left join places as pl on pl.id = n.placeId
        where
          n.id == ${id}
      `)
    )[0]?.[0]
  }

  //

  public async personsInsert(
    args: Pick<Person, 'firstname' | 'lastname' | 'tgid' | 'tgname'>, //
  ): Promise<void> {
    const { firstname, lastname, tgid, tgname } = args
    await this._execute(`
      $id = select cast((max(id) ?? 0) + 1 as uint32) from persons with xlock;
      insert into persons (
        firstname, lastname, tgname,
        created, deleted, id, tgid
      ) values (
        '${firstname}', ${Ydb.str(lastname)}, ${Ydb.str(tgname)},
        ${epochFromTimestamp()}, null, $id, ${tgid}
      )
    `)
  }

  public async personsSelect(
    args: Pick<Person, 'tgid'>, //
  ): Promise<Person | undefined> {
    const { tgid } = args
    return (
      await this._execute<Person>(`
        select *
        from persons
        where tgid == ${tgid}
      `)
    )[0]?.[0]
  }

  public async personsUpdate(
    args: Pick<Person, 'firstname' | 'id' | 'lastname' | 'tgname'>, //
  ): Promise<void> {
    const { id, firstname, lastname, tgname } = args
    await this._execute(`
      update
        persons
      set
        firstname = '${firstname}',
        lastname = ${Ydb.str(lastname)},
        tgname = ${Ydb.str(tgname)}
      where
        id == ${id}
    `)
  }

  //

  public async placesSelect(
    args: YdbArgs, //
  ): Promise<Place[]> {
    const { _limit, _offset } = args
    return (
      await this._execute<Place>(`
        select *
        from places
        order by id
        limit ${_limit}
        offset ${_offset}
      `)
    )[0]
  }

  public async placesSelectById(
    args: Pick<Place, 'id'>, //
  ): Promise<Place | undefined> {
    const { id } = args
    return (
      await this._execute<Place | undefined>(`
        select *
        from places
        where id == ${id}
      `)
    )[0]?.[0]
  }

  //

  public async tripsDelete(
    args: Pick<Trip, 'id'>, //
  ): Promise<void> {
    const { id } = args
    await this._execute(`
      update trips
      set deleted = ${epochFromTimestamp()}
      where id == ${id}
    `)
  }

  public async tripsInsert(tripsInsertItem: TripsInsertItem): Promise<void> {
    const { capacity, day, personId, tgid, tripPlaces } = tripsInsertItem
    if (tripPlaces.length === 0) throw new Error('tripPlaces.length === 0')
    const created: Trip['created'] = epochFromTimestamp()

    await this._execute(`
      $tripId = select cast((max(id) ?? 0) + 1 as uint32) from trips with xlock;
      $tripPlaceId = select cast((max(id) ?? 0) + 1 as uint32) from tripPlaces with xlock;

      insert into trips (
        capacity, day, personId,
        created, deleted, id, tgid
      ) values (
        ${capacity}, ${day}, ${personId},
        ${created}, null, $tripId, ${tgid}
      );

      insert into tripPlaces (
        minprice, placeId, tripId,
        created, deleted, id, tgid
      ) values ${tripPlaces
        .map(
          ({ minprice: tripPlaceMinprice, placeId }, index) =>
            `(
              ${tripPlaceMinprice}, ${placeId}, $tripId,
              ${created}, null, cast($tripPlaceId+${index} as uint32), ${tgid}
            )`,
        )
        .join(',')};
    `)
  }

  public async tripsSelect(
    args: YdbArgs & Partial<Pick<Trip, 'tgid'>>, //
  ): Promise<TripsSelectItem[]> {
    const { _limit, _offset, tgid } = args
    return tripSelectRowsToTripSelectDescrs(
      (
        await this._execute<TripsSelectRow>(`
          select
            t.*,
            pe.tgname as personTgname,
            pl.name as placeName,
            tp.minprice as tripPlaceMinprice
          from
            trips as t
            left join persons as pe on pe.tgid = t.tgid
            left join tripPlaces as tp on tp.tripId = t.id
            left join places as pl on pl.id = tp.placeId
          where
            t.deleted is null
            and t.day > ${epochFromTimestamp()}
            ${tgid ? `and t.tgid == ${tgid}` : ''}
          order by
            day asc,
            created desc,
            id desc
          limit ${_limit}
          offset ${_offset}
        `)
      )[0],
    )
  }

  public async tripsSelectById(
    args: Pick<Trip, 'id'>, //
  ): Promise<TripsSelectItem[]> {
    const { id } = args
    return tripSelectRowsToTripSelectDescrs(
      (
        await this._execute<TripsSelectRow>(`
          select
            t.*,
            pe.tgname as personTgname,
            pl.name as placeName,
            tp.minprice as tripPlaceMinprice
          from
            trips as t
            left join persons as pe on pe.tgid = t.tgid
            left join tripPlaces as tp on tp.tripId = t.id
            left join places as pl on pl.id = tp.placeId
          where
            t.id == ${id}
        `)
      )[0],
    )
  }
}

export const ydb: Ydb = new Ydb()
