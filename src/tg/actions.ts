import { Need, Trip, TripPlace, YdbArgs } from '../ydb'
import { _WithArrow, _WithPlaceName, Helpers, Strings, TgAction } from './utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const Actions = (() => {
  const index: TgAction = {
    button: () => ({
      payload: 'i',
      text: 'Домой',
    }),
    handler: {
      parser: () => undefined,
      pattern: /^i$/,
    },
  }

  //
  // needs
  //

  const needs: TgAction = {
    button: () => ({
      payload: 'n',
      text: Strings.NEEDS,
    }),
    handler: {
      parser: () => undefined,
      pattern: /^n$/,
    },
  }

  // create

  const needsCreate1_places: TgAction = {
    button: () => ({
      payload: 'nc1',
      text: Strings.ADD,
    }),
    handler: {
      parser: () => undefined,
      pattern: /^nc1$/,
    },
  }

  const needsCreate2_maxdays: TgAction<Pick<Need, 'placeId'> & _WithPlaceName> = {
    button: ($) => ({
      payload: `nc2:${$.placeId}`,
      text: `${$._placeName ?? $.placeId}`,
    }),
    handler: {
      parser: ([, placeId]) => ({ placeId: +placeId }),
      pattern: /^nc2:(\d+)$/,
    },
  }

  const needsCreate3_maxprices: TgAction<Pick<Need, 'placeId' | 'maxday'>> = {
    button: ($) => ({
      payload: `nc2:${$.placeId}:${$.maxday}`,
      text: `${Helpers.epochToString($.maxday)}`,
    }),
    handler: {
      parser: ([, placeId, maxday]) => ({ maxday: +maxday, placeId: +placeId }),
      pattern: /^nc2:(\d+):(\d+)$/,
    },
  }

  const needsCreate4_commit: TgAction<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>> = {
    button: ($) => ({
      payload: `nc2:${$.placeId}:${$.maxday}:${$.maxprice}`,
      text: Helpers.priceToString($.maxprice),
    }),
    handler: {
      parser: ([, placeId, maxday, maxprice]) => ({
        maxday: +maxday,
        maxprice: +maxprice,
        placeId: +placeId,
      }),
      pattern: /^nc2:(\d+):(\d+):(\d+)$/,
    },
  }

  // delete

  const needsDelete1_needs: TgAction<Pick<YdbArgs, '_offset'> & _WithArrow> = {
    button: ($) => ({
      payload: `nd1:${$._offset}`,
      text: $._arrow === undefined ? Strings.REMOVE : Helpers.paginationText($._arrow),
    }),
    handler: {
      parser: ([, _offset]) => ({ _offset: +_offset }),
      pattern: /^nd1:(\d+)$/,
    },
  }

  const needsDelete2_commit: TgAction<Pick<Need, 'id'>> = {
    button: ($) => ({
      payload: `nd2:${$.id}`,
      text: Helpers.numberToString($.id),
    }),
    handler: {
      parser: ([, id]) => ({ id: +id }),
      pattern: /^nd2:(\d+)$/,
    },
  }

  // list

  const needsList: TgAction<Pick<YdbArgs, '_offset'> & _WithArrow> = {
    button: ($) => ({
      payload: `nl:${$._offset}`,
      text: $._arrow === undefined ? Strings.LIST : Helpers.paginationText($._arrow),
    }),
    handler: {
      parser: ([, _offset]) => ({ _offset: +_offset }),
      pattern: /^nl:(\d+)$/,
    },
  }

  //
  // trips
  //

  const trips: TgAction = {
    button: () => ({
      payload: 't',
      text: Strings.TRIPS,
    }),
    handler: {
      parser: () => undefined,
      pattern: /^t$/,
    },
  }

  // create

  interface _tripsCreate345_payload {
    trip: Pick<Trip, 'capacity' | 'day'>
    tripPlaces: Array<Pick<TripPlace, 'minprice' | 'placeId'> & _WithPlaceName>
  }

  const _tripsCreate345_buttonPayload = (step: string, $: _tripsCreate345_payload): string => {
    return `${step}:${$.trip.capacity}:${$.trip.day}${$.tripPlaces
      .map(({ minprice, placeId }) => `:${placeId},${minprice}`)
      .join('')}`
  }

  const _tripsCreate345_handlerParser = (match: string[]): _tripsCreate345_payload => {
    const [, capacity, day, tripPlaces] = match
    return {
      trip: { capacity: +capacity, day: +day },
      tripPlaces: tripPlaces
        ? tripPlaces
            .split(':')
            .slice(1)
            .map((tripPlace) => {
              const [placeId, minprice] = tripPlace.split(',')
              return { minprice: +minprice, placeId: +placeId }
            })
        : [],
    }
  }

  const _tripsCreate345_handlerPattern = (step: string): RegExp => {
    return new RegExp(`^${step}:(\\d+):(\\d+)((?::\\d+,\\d+)*)$`)
  }

  const tripsCreate1_capacities: TgAction = {
    button: () => ({
      payload: 'tc1',
      text: Strings.ADD,
    }),
    handler: {
      parser: () => undefined,
      pattern: /^tc1$/,
    },
  }

  const tripsCreate2_days: TgAction<Pick<Trip, 'capacity'>> = {
    button: ($) => ({
      payload: `tc2:${$.capacity}`,
      text: `${$.capacity}`,
    }),
    handler: {
      parser: ([, capacity]) => ({ capacity: +capacity }),
      pattern: /^tc2:(\d+)$/,
    },
  }

  const tripsCreate3_places: TgAction<_tripsCreate345_payload & { _loop?: boolean }> = {
    button: ($) => ({
      payload: _tripsCreate345_buttonPayload('tc3', $),
      text:
        $._loop === undefined
          ? `${Helpers.epochToString($.trip.day)}`
          : ((): string => {
              const lastTripPlace = $.tripPlaces[$.tripPlaces.length - 1]
              if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')
              return Helpers.priceToString(lastTripPlace.minprice)
            })(),
    }),
    handler: {
      parser: _tripsCreate345_handlerParser,
      pattern: _tripsCreate345_handlerPattern('tc3'),
    },
  }

  const tripsCreate4_minprices: TgAction<_tripsCreate345_payload> = {
    button: ($) => ({
      payload: _tripsCreate345_buttonPayload('tc4', $),
      text: ((): string => {
        const lastTripPlace = $.tripPlaces[$.tripPlaces.length - 1]
        if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')
        return `${lastTripPlace._placeName ?? lastTripPlace.placeId}`
      })(),
    }),
    handler: {
      parser: _tripsCreate345_handlerParser,
      pattern: _tripsCreate345_handlerPattern('tc4'),
    },
  }

  const tripsCreate5_commit: TgAction<_tripsCreate345_payload> = {
    button: ($) => ({
      payload: _tripsCreate345_buttonPayload('tc5', $),
      text: Strings.SAVE,
    }),
    handler: {
      parser: _tripsCreate345_handlerParser,
      pattern: _tripsCreate345_handlerPattern('tc5'),
    },
  }

  // delete

  const tripsDelete1_trips: TgAction<Pick<YdbArgs, '_offset'> & _WithArrow> = {
    button: ($) => ({
      payload: `td1:${$._offset}`,
      text: $._arrow === undefined ? Strings.REMOVE : Helpers.paginationText($._arrow),
    }),
    handler: {
      parser: ([, _offset]) => ({ _offset: +_offset }),
      pattern: /^td1:(\d+)$/,
    },
  }

  const tripsDelete2_commit: TgAction<Pick<Trip, 'id'>> = {
    button: ($) => ({
      payload: `td2:${$.id}`,
      text: Helpers.numberToString($.id),
    }),
    handler: {
      parser: ([, id]) => ({ id: +id }),
      pattern: /^td2:(\d+)$/,
    },
  }

  // list

  const tripsList: TgAction<Pick<YdbArgs, '_offset'> & _WithArrow> = {
    button: ($) => ({
      payload: `tl:${$._offset}`,
      text: $._arrow === undefined ? Strings.LIST : Helpers.paginationText($._arrow),
    }),
    handler: {
      parser: ([, _offset]) => ({ _offset: +_offset }),
      pattern: /^tl:(\d+)$/,
    },
  }

  //
  //
  //

  return {
    index,

    needs,
    needsCreate1_places,
    needsCreate2_maxdays,
    needsCreate3_maxprices,
    needsCreate4_commit,
    needsDelete1_needs,
    needsDelete2_commit,
    needsList,

    trips,
    tripsCreate1_capacities,
    tripsCreate2_days,
    tripsCreate3_places,
    tripsCreate4_minprices,
    tripsCreate5_commit,
    tripsDelete1_trips,
    tripsDelete2_commit,
    tripsList,
  } as const
})()

export { Actions }
