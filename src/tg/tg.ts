// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */

import { Update } from '@grammyjs/types'
import { Telegraf } from 'telegraf'

import { arrayDeduplicate, epochFromTimestamp } from '../utils'
import { Epoch, Need, Person, Place, Tgid, Trip, TripPlace, ydb, YdbArgs } from '../ydb'
import {
  _Arrow,
  _WithArrow,
  _WithPlaceName,
  Chars,
  Helpers,
  Strings,
  TgAction,
  TgActionButton,
  TgActionResponse,
} from './utils'

class Tg {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private static readonly Actions = (() => {
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

  private static setupIndex(telegraf: Telegraf): void {
    const help: string = `Для управления ботом используйте кнопки под сообщениями.\n\nЕсли вдруг кнопки пропали или в любой другой непонятной ситуации попробуйте\n\n${Chars.x0_DOT} перезапустить бота через меню (нажать кнопку слева от поля ввода сообщений)\n\n${Chars.x0_DOT} или отправить команду /start (простым сообщением).`
    const indexActionResponse: TgActionResponse = {
      keyboard: [
        [Tg.Actions.needs.button(), Tg.Actions.trips.button()],
        [Tg.Actions.index.button()],
      ],
      message: Helpers.header('Дом') + `\n\n${help}`,
    }

    telegraf.start(async (context) => {
      const tgid: Tgid = Helpers.getTgid(context)
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person = await ydb.personsSelect({ tgid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, tgname })
      else await ydb.personsInsert({ firstname, lastname, tgid, tgname })

      await context.reply(`Dobro došli, ${firstname} ${Chars.x3_HEART}`)
      await Helpers.reply(context, indexActionResponse)
    })

    telegraf.help(async (context) => {
      await context.reply('С отзывами и предложениями стучите ко мне в телеграм: @denis_zhbankov.')
      await Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(Tg.Actions.index.handler.pattern, async (context) => {
      await Helpers.accept(context)
      await Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(/.*/, async (context) => {
      await Helpers.accept(context)
      await context.reply(help)
      await Helpers.reply(context, indexActionResponse)
    })

    telegraf.on('message', async (context) => {
      await context.reply(help)
      await Helpers.reply(context, indexActionResponse)
    })
  }

  private static setupNeeds(telegraf: Telegraf): void {
    //

    telegraf.action(Tg.Actions.needs.handler.pattern, async (context) => {
      await Helpers.accept(context)
      await Helpers.reply(context, {
        keyboard: [
          [
            Tg.Actions.needsCreate1_places.button(),
            Tg.Actions.needsDelete1_needs.button({ _offset: 0 }),
            Tg.Actions.needsList.button({ _offset: 0 }),
          ],
          [Tg.Actions.index.button()],
        ],
        message: Helpers.header(Strings.NEEDS),
      })
    })

    // create

    telegraf.action(Tg.Actions.needsCreate1_places.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const _limit: number = 32
      const places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Tg.Actions.needsCreate2_maxdays.button({ _placeName, placeId })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...placesButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nВ каком городе вас забрать?',
      })
    })

    telegraf.action(Tg.Actions.needsCreate2_maxdays.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { placeId } = Tg.Actions.needsCreate2_maxdays.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Helpers.endOfDay(Date.now())
      const maxdaysButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((days) => {
          const maxday: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Tg.Actions.needsCreate3_maxprices.button({ maxday, placeId })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...maxdaysButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nДо какого дня включительно нужно съездить?',
      })
    })

    telegraf.action(Tg.Actions.needsCreate3_maxprices.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { maxday, placeId } = Tg.Actions.needsCreate3_maxprices.handler.parser(context.match)

      const maxpricesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((maxprice) => {
          return Tg.Actions.needsCreate4_commit.button({
            maxday,
            maxprice,
            placeId,
          })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...maxpricesButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nСколько максимум вы готовы заплатить?',
      })
    })

    telegraf.action(Tg.Actions.needsCreate4_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { maxday, maxprice, placeId } = Tg.Actions.needsCreate4_commit.handler.parser(
        context.match,
      )

      const person: Person | undefined = await ydb.personsSelect({ tgid })
      if (person === undefined) throw new Error('person === undefined')

      const { id } = await ydb.needsInsert({
        maxday, //
        maxprice,
        personId: person.id,
        placeId,
        tgid,
      })

      const need = await ydb.needsSelectById({ id })
      if (need === undefined) throw new Error('need === undefined')

      let message: string = Helpers.header(Strings.NEEDS, Strings.ADDITION, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.needToString(need)}`

      await Helpers.reply(context, {
        keyboard: [[Tg.Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Tg.Actions.needsDelete1_needs.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { _offset } = Tg.Actions.needsDelete1_needs.handler.parser(context.match)

      const _limit: number = 5
      const needs = await ydb.needsSelect({ _limit, _offset, tgid })

      const needsButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: needs.map((need) => {
          return Tg.Actions.needsDelete2_commit.button({ id: need.id })
        }),
        columns: 2,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.Actions.needsDelete1_needs.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Tg.Actions.needsDelete1_needs.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = Helpers.header(
        Strings.NEEDS,
        Strings.REMOVAL,
        Helpers.pageToString({ _limit, _offset }),
      )
      if (needs.length === 0) message += `\n\n${Strings.EMPTY_PAGE}`
      else {
        for (const need of needs) {
          message += `\n\n${Helpers.needToString(need)}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [...needsButtons, paginationButtons, [Tg.Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Tg.Actions.needsDelete2_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { id } = Tg.Actions.needsDelete2_commit.handler.parser(context.match)

      await ydb.needsDelete({ id })

      const need = await ydb.needsSelectById({ id })
      if (need === undefined) throw new Error('need === undefined')
      if (need.deleted === undefined) throw new Error('need.deleted === undefined')

      let message: string = Helpers.header(Strings.NEEDS, Strings.REMOVAL, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.needToString(need)}`

      await Helpers.reply(context, {
        keyboard: [[Tg.Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Tg.Actions.needsList.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { _offset } = Tg.Actions.needsList.handler.parser(context.match)

      const _limit: number = 5
      const needs = await ydb.needsSelect({ _limit, _offset })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.Actions.needsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Tg.Actions.needsList.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = Helpers.header(
        Strings.NEEDS,
        Strings.LIST,
        Helpers.pageToString({ _limit, _offset }),
      )
      if (needs.length === 0) message += `\n\n${Strings.EMPTY_PAGE}`
      else {
        for (const need of needs) {
          message += `\n\n${Helpers.needToString(need)}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [paginationButtons, [Tg.Actions.index.button()]],
        message,
      })
    })
  }

  private static setupTrips(telegraf: Telegraf): void {
    //

    telegraf.action(Tg.Actions.trips.handler.pattern, async (context) => {
      await Helpers.accept(context)
      await Helpers.reply(context, {
        keyboard: [
          [
            Tg.Actions.tripsCreate1_capacities.button(),
            Tg.Actions.tripsDelete1_trips.button({ _offset: 0 }),
            Tg.Actions.tripsList.button({ _offset: 0 }),
          ],
          [Tg.Actions.index.button()],
        ],
        message: Helpers.header(Strings.TRIPS),
      })
    })

    // create

    telegraf.action(Tg.Actions.tripsCreate1_capacities.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const capacitiesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((capacity) => {
          return Tg.Actions.tripsCreate2_days.button({ capacity })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...capacitiesButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nСколько максимум пассажиров вы готовы взять?',
      })
    })

    telegraf.action(Tg.Actions.tripsCreate2_days.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { capacity } = Tg.Actions.tripsCreate2_days.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Helpers.endOfDay(Date.now())
      const daysButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((days) => {
          const day: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Tg.Actions.tripsCreate3_places.button({
            trip: { capacity, day },
            tripPlaces: [],
          })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...daysButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nВ какой день планируете ехать?',
      })
    })

    telegraf.action(Tg.Actions.tripsCreate3_places.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { trip, tripPlaces } = Tg.Actions.tripsCreate3_places.handler.parser(context.match)

      const _limit: number = 32
      let places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placeIds: Set<Place['id']> = new Set()
      tripPlaces.forEach(({ placeId }) => placeIds.add(placeId))
      places = places.filter(({ id }) => !placeIds.has(id))

      const placesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Tg.Actions.tripsCreate4_minprices.button({
            trip,
            tripPlaces: [...tripPlaces, { _placeName, minprice: 0, placeId }],
          })
        }),
        columns: 2,
      })

      const keyboard: TgActionButton[][] = []
      if (tripPlaces.length < 9) {
        keyboard.push(...placesButtons)
      }
      if (tripPlaces.length > 0) {
        keyboard.push([Tg.Actions.tripsCreate5_commit.button({ trip, tripPlaces })])
      }
      keyboard.push([Tg.Actions.index.button()])

      await Helpers.reply(context, {
        keyboard,
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nИз какого города (можно будет выбрать несколько) сможете забрать пассажиров?',
      })
    })

    telegraf.action(Tg.Actions.tripsCreate4_minprices.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { trip, tripPlaces } = Tg.Actions.tripsCreate4_minprices.handler.parser(context.match)
      const lastTripPlace = tripPlaces.pop()
      if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')

      const minpricesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((minprice) => {
          return Tg.Actions.tripsCreate3_places.button({
            _loop: true,
            trip,
            tripPlaces: [...tripPlaces, { minprice, placeId: lastTripPlace.placeId }],
          })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...minpricesButtons, [Tg.Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nЗа какую минимальную цену повезете из выбранного города?',
      })
    })

    telegraf.action(Tg.Actions.tripsCreate5_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { trip, tripPlaces } = Tg.Actions.tripsCreate5_commit.handler.parser(context.match)

      const person: Person | undefined = await ydb.personsSelect({ tgid })
      if (person === undefined) throw new Error('person === undefined')

      const { id } = await ydb.tripsInsert({
        ...trip, //
        personId: person.id,
        tgid,
        tripPlaces,
      })

      const trip2 = await ydb.tripsSelectById({ id })
      if (trip2 === undefined) throw new Error('trip === undefined')

      let message: string = Helpers.header(Strings.TRIPS, Strings.ADDITION, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.tripToString(trip2)}`

      await Helpers.reply(context, {
        keyboard: [[Tg.Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Tg.Actions.tripsDelete1_trips.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { _offset } = Tg.Actions.tripsDelete1_trips.handler.parser(context.match)

      const _limit: number = 10
      const trips = await ydb.tripsSelect({ _limit, _offset, tgid })

      const tripsButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: arrayDeduplicate(trips.map((trip) => trip.id)).map((tripId) => {
          return Tg.Actions.tripsDelete2_commit.button({ id: tripId })
        }),
        columns: 2,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.Actions.tripsDelete1_trips.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Tg.Actions.tripsDelete1_trips.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = Helpers.header(
        Strings.TRIPS,
        Strings.REMOVAL,
        Helpers.pageToString({ _limit, _offset }),
      )
      if (trips.length === 0) message += `\n\n${Strings.EMPTY_PAGE}`
      else {
        for (const trip of trips) {
          message += `\n\n${Helpers.tripToString(trip)}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [...tripsButtons, paginationButtons, [Tg.Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Tg.Actions.tripsDelete2_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { id } = Tg.Actions.tripsDelete2_commit.handler.parser(context.match)

      await ydb.tripsDelete({ id })

      const trip = await ydb.tripsSelectById({ id })
      if (trip === undefined) throw new Error('trip === undefined')
      if (trip.deleted === undefined) throw new Error('trip.deleted === undefined')

      let message: string = Helpers.header(Strings.TRIPS, Strings.REMOVAL, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.tripToString(trip)}`

      await Helpers.reply(context, {
        keyboard: [[Tg.Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Tg.Actions.tripsList.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { _offset } = Tg.Actions.tripsList.handler.parser(context.match)

      const _limit: number = 10
      const trips = await ydb.tripsSelect({ _limit, _offset })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.Actions.tripsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Tg.Actions.tripsList.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = Helpers.header(
        Strings.TRIPS,
        Strings.LIST,
        Helpers.pageToString({ _limit, _offset }),
      )
      if (trips.length === 0) message += `\n\n${Strings.EMPTY_PAGE}`
      else {
        for (const trip of trips) {
          message += `\n\n${Helpers.tripToString(trip)}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [paginationButtons, [Tg.Actions.index.button()]],
        message,
      })
    })
  }

  private debug: boolean | undefined
  private telegraf: Telegraf | undefined

  public async _execute(update: Update): Promise<void> {
    if (this.debug) console.log('TG : update', JSON.stringify(update))
    await this.telegraf?.handleUpdate(update)
  }

  public _setup(tgBotToken: string, debug: boolean): void {
    const telegraf: Telegraf = new Telegraf(tgBotToken)

    telegraf.use(async (context, next) => {
      if (debug) console.log('TG : context', JSON.stringify(context))
      return next()
    })

    Tg.setupNeeds(telegraf)
    Tg.setupTrips(telegraf)

    Tg.setupIndex(telegraf)

    telegraf.catch((error) => {
      if (debug) console.error('TG : error', JSON.stringify(error))
      throw error
    })

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    this.debug = debug
    this.telegraf = telegraf
  }
}

export const tg: Tg = new Tg()
