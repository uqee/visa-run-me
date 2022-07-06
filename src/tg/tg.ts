// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */

import { Update } from '@grammyjs/types'
import { Telegraf } from 'telegraf'

import { arrayDeduplicate, epochFromTimestamp } from '../utils'
import { Epoch, Person, Place, Tgid, TripDto, TripPlaceDto, ydb } from '../ydb'
import { Actions } from './actions'
import { _Arrow, Chars, Helpers, Numbers, Strings, TgActionButton, TgActionResponse } from './utils'

class Tg {
  private static setupIndex(telegraf: Telegraf): void {
    const help: string = `Для управления ботом используйте кнопки под сообщениями.\n\nЕсли вдруг кнопки пропали или в любой другой непонятной ситуации попробуйте\n\n${Chars.x0_DOT} перезапустить бота через меню (нажать кнопку слева от поля ввода сообщений)\n\n${Chars.x0_DOT} или отправить команду /start (простым сообщением).`
    const indexActionResponse: TgActionResponse = {
      keyboard: [[Actions.needs.button(), Actions.trips.button()], [Actions.index.button()]],
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

    telegraf.action(Actions.index.handler.pattern, async (context) => {
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

    telegraf.action(Actions.needs.handler.pattern, async (context) => {
      await Helpers.accept(context)
      await Helpers.reply(context, {
        keyboard: [
          [
            Actions.needsCreate1_places.button(),
            Actions.needsDelete1_needs.button({ _offset: 0 }),
            Actions.needsList.button({ _offset: 0 }),
          ],
          [Actions.index.button()],
        ],
        message: Helpers.header(Strings.NEEDS),
      })
    })

    // create

    telegraf.action(Actions.needsCreate1_places.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const _limit: number = Numbers.PLACES_SELECT_LIMIT
      const places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Actions.needsCreate2_maxdays.button({ _placeName, placeId })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...placesButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nВ каком городе вас забрать?',
      })
    })

    telegraf.action(Actions.needsCreate2_maxdays.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { placeId } = Actions.needsCreate2_maxdays.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Helpers.endOfDay(Date.now())
      const maxdaysButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((days) => {
          const maxday: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Actions.needsCreate3_maxprices.button({ maxday, placeId })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...maxdaysButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nДо какого дня включительно нужно съездить?',
      })
    })

    telegraf.action(Actions.needsCreate3_maxprices.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { maxday, placeId } = Actions.needsCreate3_maxprices.handler.parser(context.match)

      const maxpricesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((maxprice) => {
          return Actions.needsCreate4_commit.button({
            maxday,
            maxprice,
            placeId,
          })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...maxpricesButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.NEEDS, Strings.ADDITION) + //
          '\n\nСколько максимум вы готовы заплатить?',
      })
    })

    telegraf.action(Actions.needsCreate4_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { maxday, maxprice, placeId } = Actions.needsCreate4_commit.handler.parser(
        context.match,
      )

      const person: Person | undefined = await ydb.personsSelect({ tgid })
      if (person === undefined) throw new Error('person === undefined')

      const need1 = await ydb.needsInsert({ maxday, maxprice, personId: person.id, placeId, tgid })
      if (need1 === undefined) throw new Error('need1 === undefined')

      const need2 = await ydb.needsSelectById({ id: need1.id })
      if (need2 === undefined) throw new Error('need2 === undefined')

      let message: string = Helpers.header(Strings.NEEDS, Strings.ADDITION, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.needToString(need2)}`

      await Helpers.reply(context, {
        keyboard: [[Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Actions.needsDelete1_needs.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { _offset } = Actions.needsDelete1_needs.handler.parser(context.match)

      const _limit: number = Numbers.NEEDS_SELECT_LIMIT
      const needs = await ydb.needsSelect({ _limit, _offset, tgid })

      const needsButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: needs.map((need) => {
          return Actions.needsDelete2_commit.button({ id: need.id })
        }),
        columns: 3,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Actions.needsDelete1_needs.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Actions.needsDelete1_needs.button({
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
        keyboard: [...needsButtons, paginationButtons, [Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Actions.needsDelete2_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { id } = Actions.needsDelete2_commit.handler.parser(context.match)

      await ydb.needsDelete({ id })

      const need = await ydb.needsSelectById({ id })
      if (need === undefined) throw new Error('need === undefined')
      if (need.deleted === undefined) throw new Error('need.deleted === undefined')

      let message: string = Helpers.header(Strings.NEEDS, Strings.REMOVAL, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.needToString(need)}`

      await Helpers.reply(context, {
        keyboard: [[Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Actions.needsList.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { _offset } = Actions.needsList.handler.parser(context.match)

      const _limit: number = Numbers.NEEDS_SELECT_LIMIT
      const needs = await ydb.needsSelect({ _limit, _offset })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Actions.needsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Actions.needsList.button({
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
        keyboard: [paginationButtons, [Actions.index.button()]],
        message,
      })
    })
  }

  private static setupTrips(telegraf: Telegraf): void {
    //

    telegraf.action(Actions.trips.handler.pattern, async (context) => {
      await Helpers.accept(context)
      await Helpers.reply(context, {
        keyboard: [
          [
            Actions.tripsCreate1_capacities.button(),
            Actions.tripsDelete1_trips.button({ _offset: 0 }),
            Actions.tripsList.button({ _offset: 0 }),
          ],
          [Actions.index.button()],
        ],
        message: Helpers.header(Strings.TRIPS),
      })
    })

    // create

    telegraf.action(Actions.tripsCreate1_capacities.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const capacitiesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((capacity) => {
          return Actions.tripsCreate2_days.button({ capacity })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...capacitiesButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nСколько пассажиров планируете взять?',
      })
    })

    telegraf.action(Actions.tripsCreate2_days.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { capacity } = Actions.tripsCreate2_days.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Helpers.endOfDay(Date.now())
      const daysButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((days) => {
          const day: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Actions.tripsCreate3_places.button({
            trip: { capacity, day },
            tripPlaces: [],
          })
        }),
        columns: 2,
      })

      await Helpers.reply(context, {
        keyboard: [...daysButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nВ какой день планируете ехать?',
      })
    })

    telegraf.action(Actions.tripsCreate3_places.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { trip, tripPlaces } = Actions.tripsCreate3_places.handler.parser(context.match)

      const _limit: number = Numbers.PLACES_SELECT_LIMIT
      let places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placeIds: Set<Place['id']> = new Set()
      tripPlaces.forEach(({ placeId }) => placeIds.add(placeId))
      places = places.filter(({ id }) => !placeIds.has(id))

      const placesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Actions.tripsCreate4_minprices.button({
            trip,
            tripPlaces: [...tripPlaces, { _placeName, minprice: 0, placeId }],
          })
        }),
        columns: 2,
      })

      const keyboard: TgActionButton[][] = []
      if (tripPlaces.length < Numbers.MAX_PLACES_PER_TRIP) {
        keyboard.push(...placesButtons)
      }
      if (tripPlaces.length > 0) {
        keyboard.push([Actions.tripsCreate5_commit.button({ trip, tripPlaces })])
      }
      keyboard.push([Actions.index.button()])

      let message: string = Helpers.header(Strings.TRIPS, Strings.ADDITION)
      message +=
        tripPlaces.length < Numbers.MAX_PLACES_PER_TRIP
          ? '\n\nИз какого города (можно будет выбрать несколько) сможете забрать пассажиров?'
          : '\n\nДостигнут лимит по количеству городов на одну поездку, больше добавить нельзя.'
      message += '\n\nЕсли закончили добавлять города, нажмите кнопку "Сохранить".'

      await Helpers.reply(context, {
        keyboard,
        message,
      })
    })

    telegraf.action(Actions.tripsCreate4_minprices.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { trip, tripPlaces } = Actions.tripsCreate4_minprices.handler.parser(context.match)
      const lastTripPlace = tripPlaces.pop()
      if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')

      const minpricesButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((minprice) => {
          return Actions.tripsCreate3_places.button({
            _loop: true,
            trip,
            tripPlaces: [...tripPlaces, { minprice, placeId: lastTripPlace.placeId }],
          })
        }),
        columns: 3,
      })

      await Helpers.reply(context, {
        keyboard: [...minpricesButtons, [Actions.index.button()]],
        message:
          Helpers.header(Strings.TRIPS, Strings.ADDITION) + //
          '\n\nЗа какую минимальную цену повезете из выбранного города?',
      })
    })

    telegraf.action(Actions.tripsCreate5_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { trip, tripPlaces } = Actions.tripsCreate5_commit.handler.parser(context.match)

      const person: Person | undefined = await ydb.personsSelect({ tgid })
      if (person === undefined) throw new Error('person === undefined')

      const trip1 = await ydb.tripsInsert({ ...trip, personId: person.id, tgid }, tripPlaces)
      if (trip1 === undefined) throw new Error('trip1 === undefined')

      const trip2: TripDto | undefined = await ydb.tripsSelectById({ id: trip1.id })
      if (trip2 === undefined) throw new Error('trip2 === undefined')

      const tripPlaces2: TripPlaceDto[] = await ydb.tripPlacesSelect([trip2.id])

      let message: string = Helpers.header(Strings.TRIPS, Strings.ADDITION, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.tripToString(trip2, tripPlaces2)}`

      await Helpers.reply(context, {
        keyboard: [[Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Actions.tripsDelete1_trips.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const tgid: Tgid = Helpers.getTgid(context)
      const { _offset } = Actions.tripsDelete1_trips.handler.parser(context.match)

      const _limit: number = Numbers.TRIPS_SELECT_LIMIT
      const trips: TripDto[] = await ydb.tripsSelect({ _limit, _offset, tgid })
      const tripsPlaces: TripPlaceDto[] = await ydb.tripPlacesSelect(trips.map((trip) => trip.id))

      const tripsButtons: TgActionButton[][] = Helpers.keyboard2d({
        buttons: arrayDeduplicate(trips.map((trip) => trip.id)).map((tripId) => {
          return Actions.tripsDelete2_commit.button({ id: tripId })
        }),
        columns: 3,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Actions.tripsDelete1_trips.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Actions.tripsDelete1_trips.button({
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
          message += `\n\n${Helpers.tripToString(
            trip,
            tripsPlaces.filter((tripPlace) => tripPlace.tripId === trip.id),
          )}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [...tripsButtons, paginationButtons, [Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Actions.tripsDelete2_commit.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { id } = Actions.tripsDelete2_commit.handler.parser(context.match)

      const trip: TripDto | undefined = await ydb.tripsSelectById({ id })
      if (trip === undefined) throw new Error('trip === undefined')

      const tripsPlaces: TripPlaceDto[] = await ydb.tripPlacesSelect([trip.id])

      await ydb.tripsDelete({ id })

      let message: string = Helpers.header(Strings.TRIPS, Strings.REMOVAL, Strings.SUCCESSFUL)
      message += `\n\n${Helpers.tripToString(trip, tripsPlaces)}`

      await Helpers.reply(context, {
        keyboard: [[Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Actions.tripsList.handler.pattern, async (context) => {
      await Helpers.accept(context)

      const { _offset } = Actions.tripsList.handler.parser(context.match)

      const _limit: number = Numbers.TRIPS_SELECT_LIMIT
      const trips: TripDto[] = await ydb.tripsSelect({ _limit, _offset })
      const tripsPlaces: TripPlaceDto[] = await ydb.tripPlacesSelect(trips.map((trip) => trip.id))

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Actions.tripsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Actions.tripsList.button({
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
          message += `\n\n${Helpers.tripToString(
            trip,
            tripsPlaces.filter((tripPlace) => tripPlace.tripId === trip.id),
          )}`
        }
      }

      await Helpers.reply(context, {
        keyboard: [paginationButtons, [Actions.index.button()]],
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
