// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardButton, Update } from '@grammyjs/types'
import { Context, Markup, Telegraf } from 'telegraf'

import { arrayDeduplicate, epochFromTimestamp, epochToTimestamp } from '../utils'
import {
  Epoch,
  Need,
  NeedDto,
  Person,
  Place,
  Tgid,
  Trip,
  TripDto,
  TripPlace,
  ydb,
  YdbArgs,
} from '../ydb'

//

interface TgActionButton {
  hidden?: boolean
  payload: string
  text: string
}

interface TgActionResponse {
  keyboard: Array<Array<TgActionButton | undefined>>
  message: string
}

interface TgAction<TArgs extends object | void = void> {
  button: (args: TArgs) => TgActionButton
  handler: {
    parser: (contextMatch: string[]) => TArgs
    pattern: RegExp
  }
}

//

enum _Arrow {
  LEFT,
  RIGHT,
}

interface _WithArrow {
  _arrow?: _Arrow
}

interface _WithPlaceName {
  _placeName?: Place['name']
}

//

class Tg {
  private static readonly x0_Constants = {
    ADDITION: 'Добавление',
    ADDITION_SUCCESSFUL: 'Добавление успешно',
    EMPTY_PAGE: 'Пустая страница',
    LIST: 'Список',
    MONTH_NAMES: {
      '01': 'января',
      '02': 'февраля',
      '03': 'марта',
      '04': 'апреля',
      '05': 'мая',
      '06': 'июня',
      '07': 'июля',
      '08': 'августа',
      '09': 'сентября',
      10: 'октября',
      11: 'ноября',
      12: 'декабря',
    } as Record<string, string>,
    NEEDS: 'Заявки',
    REMOVAL: 'Удаление',
    REMOVAL_CHOOSE_NUMBER: 'Выберите номер для удаления',
    REMOVAL_SUCCESSFUL: 'Удаление успешно',
    TRIPS: 'Поездки',
  } as const

  private static readonly x0_Symbols = {
    x0_ARROW_DOWN: '↓',
    x0_ARROW_LEFT: '←',
    x0_ARROW_RIGHT: '→',
    x0_ARROW_UP: '↑',
    x0_CHECK: '✓',
    x0_CIRCLE: '◯',
    x0_CROSS: '╳',
    x0_DOT: '⋅',
    x0_EM_DASH: '—',
    x0_EN_DASH: '–',
    x0_MINUS: '−',
    x0_MULT: '×',
    x0_PLUS: '+',
    x0_QUOTE_DOUBLE_LEFT: '«',
    x0_QUOTE_DOUBLE_RIGHT: '»',
    x0_QUOTE_LEFT: '‹',
    x0_QUOTE_RIGHT: '›',
    x1_EURO: '€',
    x1_INFINITY: '∞',
    x2_ARROWHEAD: '➤',
    x2_BULLET: '•',
    x2_CHEVRON_LEFT: '❮',
    x2_CHEVRON_RIGHT: '❯',
    x2_MINUS: '➖',
    x2_MULT: '✖',
    x2_PLUS: '➕',
    x2_QUOTE_CLOSE: '❜',
    x2_QUOTE_DOUBLE_CLOSE: '❞',
    x2_QUOTE_DOUBLE_OPEN: '❝',
    x2_QUOTE_OPEN: '❛',
    x2_STAR: '★',
    x2_TRIANGLE_DOWN: '▼',
    x2_TRIANGLE_LEFT: '◀',
    x2_TRIANGLE_RIGHT: '▶',
    x2_TRIANGLE_UP: '▲',
    x3_CHECK: '✅',
    x3_CROSS: '❌',
    x3_EXCLAMATION: '❗',
    x3_HEART: '♥',
    x3_HOURGLASS: '⏳',
    x3_LIKE: '👍',
    x3_QUESTION: '❓',
    x3_WTF: '⁉',
  } as const

  private static readonly x1_Format = {
    bold: (s: string): string => `<b>${s}</b>`,
    code: (s: string): string => `<code class="language-python">${s}</code>`,
    italic: (s: string): string => `<i>${s}</i>`,
    link: (s: string, url: string): string => `<a href="${url}">${s}</a>`,
    pre: (s: string): string => `<pre>${s}</pre>`,
    spoiler: (s: string): string => `<span class="tg-spoiler">${s}</span>`,
    strikethrough: (s: string): string => `<s>${s}</s>`,
    underline: (s: string): string => `<u>${s}</u>`,
  } as const

  private static readonly x1_Helpers = {
    accept: async (context: Context): Promise<void> => {
      await context.answerCbQuery(undefined, { cache_time: 3 })
      await context.deleteMessage()
    },

    endOfDay: (timestamp: number): number => {
      const endOfDay = new Date(timestamp)
      endOfDay.setUTCHours(23, 59, 59, 0)
      return endOfDay.getTime()
    },

    epochToString: (epoch: Epoch): string => {
      const [m, d] = new Date(epochToTimestamp(epoch)).toISOString().substring(5, 10).split('-')
      return `${+d} ${Tg.x0_Constants.MONTH_NAMES[m]}`
    },

    escape: (message: string): string => {
      // https://core.telegram.org/bots/api#html-style
      return message
        .replace(/&/g, '&amp;') //
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    },

    getTgid: (context: Context): Tgid | never => {
      const tgid: Tgid | undefined = context.from?.id
      if (tgid === undefined) throw new Error('tgid === undefined')
      return tgid
    },

    header: (header: string, subheader?: string): string => {
      let text: string = Tg.x1_Format.bold(header)
      if (subheader) text += `${Tg.x0_Symbols.x0_DOT}${subheader}`
      return text
    },

    keyboard2d: (args: { buttons: TgActionButton[]; columns: number }): TgActionButton[][] => {
      const { buttons, columns } = args
      const keyboard1d: TgActionButton[] = buttons.slice()
      const keyboard2d: TgActionButton[][] = []
      while (keyboard1d.length) keyboard2d.push(keyboard1d.splice(0, columns))
      return keyboard2d
    },

    needToString: (
      args: Partial<Pick<NeedDto, 'id'>> &
        Pick<NeedDto, 'maxday' | 'maxprice' | 'personTgname' | 'placeName' | 'tgid'>,
    ): string => {
      const { id, maxday, maxprice, personTgname, placeName, tgid } = args
      let message: string = ''

      message += `№ ${id ?? '??'} ${Tg.x1_Format.spoiler(
        Tg.x1_Helpers.userLink(personTgname, tgid),
      )}\n`

      message += `${Tg.x0_Symbols.x0_DOT} из ${placeName}\n`
      message += `${Tg.x0_Symbols.x0_DOT} до ${Tg.x1_Helpers.epochToString(maxday)}\n`
      message += `${Tg.x0_Symbols.x0_DOT} за ${maxprice} ${Tg.x0_Symbols.x1_EURO}\n`

      return message
    },

    paginationText: (_arrow?: _Arrow): string => {
      if (_arrow === _Arrow.LEFT) return `${Tg.x0_Symbols.x0_ARROW_LEFT} Назад`
      if (_arrow === _Arrow.RIGHT) return `Вперед ${Tg.x0_Symbols.x0_ARROW_RIGHT}`
      return Tg.x0_Symbols.x0_ARROW_DOWN
    },

    reply: async (context: Context, response: TgActionResponse): Promise<void> => {
      const { keyboard, message } = response
      await context.replyWithHTML(
        message,
        Markup.inlineKeyboard(Tg.x1_Helpers.reply_getNativeKeyboard(keyboard)),
      )
    },

    reply_getNativeKeyboard: (
      keyboard: Array<Array<TgActionButton | undefined>>,
    ): InlineKeyboardButton.CallbackButton[][] => {
      return keyboard
        .filter((buttons) => !!buttons.length)
        .map((buttons) => {
          return buttons
            .filter((button: TgActionButton | undefined): button is TgActionButton => !!button)
            .map(({ hidden, payload, text }) => Markup.button.callback(text, payload, hidden))
        })
    },

    tripToString: (
      args: Partial<Pick<TripDto, 'id'>> &
        Pick<TripDto, 'capacity' | 'day' | 'personTgname' | 'tgid' | 'tripPlaces'>,
    ): string => {
      const { capacity, day, id, personTgname, tgid, tripPlaces } = args
      let message: string = ''

      message += `№ ${id ?? '??'} ${Tg.x1_Format.spoiler(
        Tg.x1_Helpers.userLink(personTgname, tgid),
      )}\n`

      message += `${Tg.x0_Symbols.x0_DOT} выезд ${Tg.x1_Helpers.epochToString(day)}\n`
      message += `${Tg.x0_Symbols.x0_DOT} пассажиров ${capacity}\n`
      for (const tripPlace of tripPlaces) {
        message += `${Tg.x0_Symbols.x0_DOT} `
        message += `из ${tripPlace.placeName} `
        message += `за ${tripPlace.minprice} ${Tg.x0_Symbols.x1_EURO}\n`
      }

      return message
    },

    userLink: (tgname: Person['tgname'], tgid: Tgid): string => {
      return Tg.x1_Format.link(`@${tgname ?? tgid}`, `tg://user?id=${tgid}`)
    },
  } as const

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private static readonly x2_Actions = (() => {
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
        text: Tg.x0_Constants.NEEDS,
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
        text: 'Добавить',
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
        text: `${Tg.x1_Helpers.epochToString($.maxday)}`,
      }),
      handler: {
        parser: ([, placeId, maxday]) => ({ maxday: +maxday, placeId: +placeId }),
        pattern: /^nc2:(\d+):(\d+)$/,
      },
    }

    const needsCreate4_commit: TgAction<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>> = {
      button: ($) => ({
        payload: `nc2:${$.placeId}:${$.maxday}:${$.maxprice}`,
        text: `${$.maxprice} ${Tg.x0_Symbols.x1_EURO}`,
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
        text: $._arrow === undefined ? 'Удалить' : Tg.x1_Helpers.paginationText($._arrow),
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^nd1:(\d+)$/,
      },
    }

    const needsDelete2_commit: TgAction<Pick<Need, 'id'>> = {
      button: ($) => ({
        payload: `nd2:${$.id}`,
        text: `№${$.id}`,
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
        text: $._arrow === undefined ? 'Список' : Tg.x1_Helpers.paginationText($._arrow),
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
        text: Tg.x0_Constants.TRIPS,
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
        text: 'Добавить',
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
            ? `${Tg.x1_Helpers.epochToString($.trip.day)}`
            : ((): string => {
                const lastTripPlace = $.tripPlaces[$.tripPlaces.length - 1]
                if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')

                let message: string = ''
                message += `${lastTripPlace.minprice} ${Tg.x0_Symbols.x1_EURO}`

                return message
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

          let message: string = ''
          message += `${lastTripPlace._placeName ?? lastTripPlace.placeId}`

          return message
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
        text: 'Сохранить',
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
        text: $._arrow === undefined ? 'Удалить' : Tg.x1_Helpers.paginationText($._arrow),
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^td1:(\d+)$/,
      },
    }

    const tripsDelete2_commit: TgAction<Pick<Trip, 'id'>> = {
      button: ($) => ({
        payload: `td2:${$.id}`,
        text: `№ ${$.id}`,
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
        text: $._arrow === undefined ? 'Список' : Tg.x1_Helpers.paginationText($._arrow),
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
    const help: string =
      'Для управления ботом используйте кнопки под сообщениями. Если вдруг кнопки пропали или в любой другой непонятной ситуации попробуйте перезапустить бота через меню (нажать кнопку слева от поля ввода сообщений) или командой /start (отправить сообщением).'
    const indexActionResponse: TgActionResponse = {
      keyboard: [[Tg.x2_Actions.needs.button(), Tg.x2_Actions.trips.button()]],
      message: `${Tg.x1_Helpers.header('Домашняя страница')}\n\n${help}`,
    }

    telegraf.start(async (context) => {
      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person = await ydb.personsSelect({ tgid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, tgname })
      else await ydb.personsInsert({ firstname, lastname, tgid, tgname })

      await context.reply(`Dobro došli, ${firstname} ${Tg.x0_Symbols.x3_HEART}`)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.help(async (context) => {
      await context.reply('С отзывами и предложениями стучите ко мне в телеграм: @denis_zhbankov.')
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(Tg.x2_Actions.index.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(/.*/, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await context.reply(help)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.on('message', async (context) => {
      await context.reply(help)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })
  }

  private static setupNeeds(telegraf: Telegraf): void {
    //

    telegraf.action(Tg.x2_Actions.needs.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          [
            Tg.x2_Actions.needsCreate1_places.button(),
            Tg.x2_Actions.needsDelete1_needs.button({ _offset: 0 }),
            Tg.x2_Actions.needsList.button({ _offset: 0 }),
          ],
          [Tg.x2_Actions.index.button()],
        ],
        message: Tg.x1_Helpers.header(Tg.x0_Constants.NEEDS),
      })
    })

    // create

    telegraf.action(Tg.x2_Actions.needsCreate1_places.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const _limit: number = 32
      const places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placesButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Tg.x2_Actions.needsCreate2_maxdays.button({ _placeName, placeId })
        }),
        columns: 2,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...placesButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.NEEDS, Tg.x0_Constants.ADDITION)}\n\n` +
          'В каком городе вас забрать?',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate2_maxdays.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { placeId } = Tg.x2_Actions.needsCreate2_maxdays.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Tg.x1_Helpers.endOfDay(Date.now())
      const maxdaysButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((days) => {
          const maxday: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Tg.x2_Actions.needsCreate3_maxprices.button({ maxday, placeId })
        }),
        columns: 2,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...maxdaysButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.NEEDS, Tg.x0_Constants.ADDITION)}\n\n` +
          'До какого дня включительно нужно съездить?',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate3_maxprices.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { maxday, placeId } = Tg.x2_Actions.needsCreate3_maxprices.handler.parser(context.match)

      const maxpricesButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((maxprice) => {
          return Tg.x2_Actions.needsCreate4_commit.button({
            maxday,
            maxprice,
            placeId,
          })
        }),
        columns: 3,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...maxpricesButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.NEEDS, Tg.x0_Constants.ADDITION)}\n\n` +
          'Сколько максимум вы готовы заплатить?',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate4_commit.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { maxday, maxprice, placeId } = Tg.x2_Actions.needsCreate4_commit.handler.parser(
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

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.NEEDS,
        Tg.x0_Constants.ADDITION_SUCCESSFUL,
      )}\n\n`
      message += Tg.x1_Helpers.needToString(need)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Tg.x2_Actions.needsDelete1_needs.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { _offset } = Tg.x2_Actions.needsDelete1_needs.handler.parser(context.match)

      const _limit: number = 9
      const needs = await ydb.needsSelect({ _limit, _offset, tgid })

      const needsButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: needs.map((need) => {
          return Tg.x2_Actions.needsDelete2_commit.button({ id: need.id })
        }),
        columns: 2,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.x2_Actions.needsDelete1_needs.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Tg.x2_Actions.needsDelete1_needs.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.NEEDS,
        Tg.x0_Constants.REMOVAL_CHOOSE_NUMBER,
      )}\n\n`
      if (needs.length === 0) message += Tg.x0_Constants.EMPTY_PAGE
      else {
        for (const need of needs) {
          message += Tg.x1_Helpers.needToString(need) + '\n\n'
        }
      }

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...needsButtons, paginationButtons, [Tg.x2_Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Tg.x2_Actions.needsDelete2_commit.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { id } = Tg.x2_Actions.needsDelete2_commit.handler.parser(context.match)

      await ydb.needsDelete({ id })

      const need = await ydb.needsSelectById({ id })
      if (need === undefined) throw new Error('need === undefined')
      if (need.deleted === undefined) throw new Error('need.deleted === undefined')

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.NEEDS,
        Tg.x0_Constants.REMOVAL_SUCCESSFUL,
      )}\n\n`
      message += Tg.x1_Helpers.needToString(need)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Tg.x2_Actions.needsList.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { _offset } = Tg.x2_Actions.needsList.handler.parser(context.match)

      const _limit: number = 9
      const needs = await ydb.needsSelect({ _limit, _offset })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.x2_Actions.needsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        needs.length === _limit
          ? Tg.x2_Actions.needsList.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.NEEDS,
        Tg.x0_Constants.LIST,
      )}\n\n`
      if (needs.length === 0) message += Tg.x0_Constants.EMPTY_PAGE
      else {
        for (const need of needs) {
          message += Tg.x1_Helpers.needToString(need) + '\n\n'
        }
      }

      await Tg.x1_Helpers.reply(context, {
        keyboard: [paginationButtons, [Tg.x2_Actions.index.button()]],
        message,
      })
    })
  }

  private static setupTrips(telegraf: Telegraf): void {
    //

    telegraf.action(Tg.x2_Actions.trips.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          [
            Tg.x2_Actions.tripsCreate1_capacities.button(),
            Tg.x2_Actions.tripsDelete1_trips.button({ _offset: 0 }),
            Tg.x2_Actions.tripsList.button({ _offset: 0 }),
          ],
          [Tg.x2_Actions.index.button()],
        ],
        message: Tg.x1_Helpers.header(Tg.x0_Constants.TRIPS),
      })
    })

    // create

    telegraf.action(Tg.x2_Actions.tripsCreate1_capacities.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const capacitiesButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((capacity) => {
          return Tg.x2_Actions.tripsCreate2_days.button({ capacity })
        }),
        columns: 3,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...capacitiesButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.TRIPS, Tg.x0_Constants.ADDITION)}\n\n` +
          'Сколько максимум пассажиров вы готовы взять?',
      })
    })

    telegraf.action(Tg.x2_Actions.tripsCreate2_days.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { capacity } = Tg.x2_Actions.tripsCreate2_days.handler.parser(context.match)

      const dayInMilliseconds: number = 24 * 60 * 60 * 1000
      const today: number = Tg.x1_Helpers.endOfDay(Date.now())
      const daysButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((days) => {
          const day: Epoch = epochFromTimestamp(today + days * dayInMilliseconds)
          return Tg.x2_Actions.tripsCreate3_places.button({
            trip: { capacity, day },
            tripPlaces: [],
          })
        }),
        columns: 2,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...daysButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.TRIPS, Tg.x0_Constants.ADDITION)}\n\n` +
          'В какой день планируете ехать?',
      })
    })

    telegraf.action(Tg.x2_Actions.tripsCreate3_places.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { trip, tripPlaces } = Tg.x2_Actions.tripsCreate3_places.handler.parser(context.match)

      const _limit: number = 32
      let places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      const placeIds: Set<Place['id']> = new Set()
      tripPlaces.forEach(({ placeId }) => placeIds.add(placeId))
      places = places.filter(({ id }) => !placeIds.has(id))

      const placesButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: places.map(({ id: placeId, name: _placeName }) => {
          return Tg.x2_Actions.tripsCreate4_minprices.button({
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
        keyboard.push([Tg.x2_Actions.tripsCreate5_commit.button({ trip, tripPlaces })])
      }
      keyboard.push([Tg.x2_Actions.index.button()])

      await Tg.x1_Helpers.reply(context, {
        keyboard,
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.TRIPS, Tg.x0_Constants.ADDITION)}\n\n` +
          'Из какого города (можно будет выбрать несколько) сможете забрать пассажиров?',
      })
    })

    telegraf.action(Tg.x2_Actions.tripsCreate4_minprices.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { trip, tripPlaces } = Tg.x2_Actions.tripsCreate4_minprices.handler.parser(
        context.match,
      )
      const lastTripPlace = tripPlaces.pop()
      if (lastTripPlace === undefined) throw new Error('lastTripPlace === undefined')

      const minpricesButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((minprice) => {
          return Tg.x2_Actions.tripsCreate3_places.button({
            _loop: true,
            trip,
            tripPlaces: [...tripPlaces, { minprice, placeId: lastTripPlace.placeId }],
          })
        }),
        columns: 3,
      })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...minpricesButtons, [Tg.x2_Actions.index.button()]],
        message:
          `${Tg.x1_Helpers.header(Tg.x0_Constants.TRIPS, Tg.x0_Constants.ADDITION)}\n\n` +
          'За какую минимальную цену повезете из выбранного города?',
      })
    })

    telegraf.action(Tg.x2_Actions.tripsCreate5_commit.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { trip, tripPlaces } = Tg.x2_Actions.tripsCreate5_commit.handler.parser(context.match)

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

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.TRIPS,
        Tg.x0_Constants.ADDITION_SUCCESSFUL,
      )}\n\n`
      message += Tg.x1_Helpers.tripToString(trip2)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.index.button()]],
        message,
      })
    })

    // delete

    telegraf.action(Tg.x2_Actions.tripsDelete1_trips.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { _offset } = Tg.x2_Actions.tripsDelete1_trips.handler.parser(context.match)

      const _limit: number = 9
      const trips = await ydb.tripsSelect({ _limit, _offset, tgid })

      const tripsButtons: TgActionButton[][] = Tg.x1_Helpers.keyboard2d({
        buttons: arrayDeduplicate(trips.map((trip) => trip.id)).map((tripId) => {
          return Tg.x2_Actions.tripsDelete2_commit.button({ id: tripId })
        }),
        columns: 2,
      })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.x2_Actions.tripsDelete1_trips.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Tg.x2_Actions.tripsDelete1_trips.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.TRIPS,
        Tg.x0_Constants.REMOVAL_CHOOSE_NUMBER,
      )}\n\n`
      if (trips.length === 0) message += Tg.x0_Constants.EMPTY_PAGE
      else {
        for (const trip of trips) {
          message += Tg.x1_Helpers.tripToString(trip) + '\n\n'
        }
      }

      await Tg.x1_Helpers.reply(context, {
        keyboard: [...tripsButtons, paginationButtons, [Tg.x2_Actions.index.button()]],
        message,
      })
    })

    telegraf.action(Tg.x2_Actions.tripsDelete2_commit.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { id } = Tg.x2_Actions.tripsDelete2_commit.handler.parser(context.match)

      await ydb.tripsDelete({ id })

      const trip = await ydb.tripsSelectById({ id })
      if (trip === undefined) throw new Error('trip === undefined')
      if (trip.deleted === undefined) throw new Error('trip.deleted === undefined')

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.TRIPS,
        Tg.x0_Constants.REMOVAL_SUCCESSFUL,
      )}\n\n`
      message += Tg.x1_Helpers.tripToString(trip)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.index.button()]],
        message,
      })
    })

    // list

    telegraf.action(Tg.x2_Actions.tripsList.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { _offset } = Tg.x2_Actions.tripsList.handler.parser(context.match)

      const _limit: number = 9
      const trips = await ydb.tripsSelect({ _limit, _offset })

      const paginationButtons: Array<TgActionButton | undefined> = [
        _offset - _limit >= 0
          ? Tg.x2_Actions.tripsList.button({
              _arrow: _Arrow.LEFT,
              _offset: _offset - _limit,
            })
          : undefined,
        trips.length === _limit
          ? Tg.x2_Actions.tripsList.button({
              _arrow: _Arrow.RIGHT, //
              _offset: _offset + _limit,
            })
          : undefined,
      ]

      let message: string = `${Tg.x1_Helpers.header(
        Tg.x0_Constants.TRIPS,
        Tg.x0_Constants.LIST,
      )}\n\n`
      if (trips.length === 0) message += Tg.x0_Constants.EMPTY_PAGE
      else {
        for (const trip of trips) {
          message += Tg.x1_Helpers.tripToString(trip) + '\n\n'
        }
      }

      await Tg.x1_Helpers.reply(context, {
        keyboard: [paginationButtons, [Tg.x2_Actions.index.button()]],
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
