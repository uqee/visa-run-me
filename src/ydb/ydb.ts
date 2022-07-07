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

export type NeedDto = Need & {
  personTgname: Person['tgname']
  placeName: Place['name']
}

export type TripDto = Trip & {
  personTgname: Person['tgname']
}

export type TripPlaceDto = TripPlace & {
  placeName: Place['name']
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
  ): Promise<Pick<Need, 'id'> | undefined> {
    const { maxday, maxprice, personId, placeId, tgid } = args
    return (
      await this._execute<Pick<Need, 'id'>>(`
        $id = select cast((max(id) ?? 0) + 1 as uint32) from needs with xlock;

        insert into needs (
          maxday, maxprice, personId, placeId,
          created, deleted, id, tgid
        ) values (
          ${maxday}, ${maxprice}, ${personId}, ${placeId},
          ${epochFromTimestamp()}, null, $id, ${tgid}
        );

        select $id as id;
      `)
    )[0]?.[0]
  }

  public async needsSelect(
    args: YdbArgs & Partial<Pick<Need, 'tgid'>>, //
  ): Promise<NeedDto[]> {
    const { _limit, _offset, tgid } = args
    return (
      await this._execute<NeedDto>(`
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
  ): Promise<NeedDto | undefined> {
    const { id } = args
    return (
      await this._execute<NeedDto | undefined>(`
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
  ): Promise<Pick<Person, 'id'> | undefined> {
    const { firstname, lastname, tgid, tgname } = args
    return (
      await this._execute<Pick<Person, 'id'>>(`
        $id = select cast((max(id) ?? 0) + 1 as uint32) from persons with xlock;
        insert into persons (
          firstname, lastname, tgname,
          created, deleted, id, tgid
        ) values (
          '${firstname}', ${Ydb.str(lastname)}, ${Ydb.str(tgname)},
          ${epochFromTimestamp()}, null, $id, ${tgid}
        );
        select $id as id;
      `)
    )[0]?.[0]
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

  public async tripPlacesDelete(
    args: Pick<TripPlace, 'tripId'>, //
  ): Promise<void> {
    const { tripId } = args
    await this._execute(`
      update tripPlaces
      set deleted = ${epochFromTimestamp()}
      where tripId == ${tripId}
    `)
  }

  public async tripPlacesInsert(
    args: Array<Pick<TripPlace, 'minprice' | 'placeId' | 'tgid' | 'tripId'>>, //
  ): Promise<Pick<TripPlace, 'id'> | undefined> {
    if (args.length === 0) throw new Error('args.length === 0')
    return (
      await this._execute<Pick<TripPlace, 'id'>>(`
        $id = select cast((max(id) ?? 0) + 1 as uint32) from tripPlaces with xlock;

        insert into tripPlaces (
          minprice, placeId, tripId,
          created, deleted, id, tgid
        ) values ${args
          .map(
            ({ minprice, placeId, tgid, tripId }, index) =>
              `(
                ${minprice}, ${placeId}, ${tripId},
                ${epochFromTimestamp()}, null, cast($id+${index} as uint32), ${tgid}
              )`,
          )
          .join(',')};

        select $id as id;
      `)
    )[0]?.[0]
  }

  public async tripPlacesSelect(
    args: Array<Trip['id']>, //
  ): Promise<TripPlaceDto[]> {
    if (args.length === 0) return []
    return (
      await this._execute<TripPlaceDto>(`
      select
        t.*,
        p.name as placeName,
      from
        tripPlaces as t
        left join places as p on p.id = t.placeId
      where
        t.tripId in (${args.join(',')})
        and t.deleted is null
      order by
        tripId desc,
        placeId asc
    `)
    )[0]
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

    await this.tripPlacesDelete({ tripId: id })
  }

  public async tripsInsert(
    args1: Pick<Trip, 'day' | 'personId' | 'tgid'>,
    args2: Array<Pick<TripPlace, 'minprice' | 'placeId'>>,
  ): Promise<Pick<Trip, 'id'> | undefined> {
    const { day, personId, tgid } = args1

    const result = (
      await this._execute<Pick<Trip, 'id'>>(`
        $id = select cast((max(id) ?? 0) + 1 as uint32) from trips with xlock;

        insert into trips (
          day, personId,
          created, deleted, id, tgid
        ) values (
          ${day}, ${personId},
          ${epochFromTimestamp()}, null, $id, ${tgid}
        );

        select $id as id;
      `)
    )[0]?.[0]

    const tripId: Trip['id'] | undefined = result?.id
    if (tripId === undefined) throw new Error('tripId === undefined')

    await this.tripPlacesInsert(
      args2.map(({ minprice, placeId }) => ({ minprice, placeId, tgid, tripId })),
    )

    return result
  }

  public async tripsSelect(
    args: YdbArgs & Partial<Pick<Trip, 'tgid'>>, //
  ): Promise<TripDto[]> {
    const { _limit, _offset, tgid } = args
    return (
      await this._execute<TripDto>(`
        select
          t.*,
          p.tgname as personTgname,
        from
          trips as t
          left join persons as p on p.tgid = t.tgid
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
    )[0]
  }

  public async tripsSelectById(
    args: Pick<Trip, 'id'>, //
  ): Promise<TripDto | undefined> {
    const { id } = args
    return (
      await this._execute<TripDto>(`
        select
          t.*,
          p.tgname as personTgname,
        from
          trips as t
          left join persons as p on p.tgid = t.tgid
        where
          t.id == ${id}
      `)
    )[0]?.[0]
  }
}

export const ydb: Ydb = new Ydb()
