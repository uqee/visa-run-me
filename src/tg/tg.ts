// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardButton, Update } from '@grammyjs/types'
import { Context, Markup, Telegraf } from 'telegraf'

import { epochFromDate } from '../utils'
import { Need, Person, Place, Tgid, Trip, TripPlace, ydb, YdbArgs } from '../ydb'

//

interface TgActionButton {
  hidden?: boolean
  payload: string
  text: string
}

interface TgActionResponse {
  keyboard: TgActionButton[][]
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

class Tg {
  private static readonly x0_Symbols = {
    x0_ARROW_DOWN: '↓',
    x0_ARROW_LEFT: '←',
    x0_ARROW_RIGHT: '→',
    x0_ARROW_UP: '↑',
    x0_CHECK: '✓',
    x0_CIRCLE: '◯',
    x0_CROSS: '╳',
    x0_DOT: '⋅',
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

  private static readonly x1_Helpers = {
    _toCallbackButtons: (matrix: TgActionButton[][]): InlineKeyboardButton.CallbackButton[][] => {
      return matrix.map((array) => {
        return array.map((button) => {
          const { hidden, payload, text } = button
          return Markup.button.callback(text, payload, hidden)
        })
      })
    },

    _toEscapedMarkdown: (message: string): string => {
      for (const char of '+-()_') message = message.replaceAll(char, `\\${char}`)
      return message
    },

    accept: async (context: Context): Promise<void> => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
    },

    create: <TArgs extends object | void = void>({
      action,
      buttonText,
    }: {
      action: string
      buttonText: (args: TArgs) => string
    }): TgAction<TArgs> => {
      interface TgActionButtonPayload<TPayload extends object | unknown = unknown> {
        a: string // action
        p: TPayload // payload
      }
      return {
        button: (payload) => ({
          payload: JSON.stringify({ a: action, p: payload } as TgActionButtonPayload<TArgs>),
          text: buttonText(payload),
        }),
        handler: {
          parser: ([payload]) => (JSON.parse(payload) as TgActionButtonPayload<TArgs>).p,
          pattern: new RegExp(`^{\\"a\\":\\"${action}\\".*`),
        },
      }
    },

    getTgid: (context: Context): Tgid | never => {
      const tgid: Tgid | undefined = context.from?.id
      if (tgid === undefined) throw new Error('tgid === undefined')
      return tgid
    },

    reply: async (context: Context, response: TgActionResponse): Promise<void> => {
      const { keyboard, message } = response
      await context.replyWithMarkdownV2(
        Tg.x1_Helpers._toEscapedMarkdown(message),
        Markup.inlineKeyboard(Tg.x1_Helpers._toCallbackButtons(keyboard)),
      )
    },
  } as const

  private static readonly x1_Markdown = {
    bold: (s: string): string => `*${s}*`,
    code: (s: string): string => `\`\`\`${s}\`\`\``,
    italic: (s: string): string => `_${s}_`,
    link: (s: string, url: string): string => `[${s}](${url})`,
    linkuser: (s: string, tgid: string): string => `[${s}](tg://user?id=${tgid})`,
    monospace: (s: string): string => `\`${s}\``,
    spoiler: (s: string): string => `||${s}||`,
    strikethrough: (s: string): string => `~${s}~`,
    underline: (s: string): string => `__${s}__`,
  } as const

  private static readonly x1_Strings = {
    CREATE: `${Tg.x0_Symbols.x0_PLUS} Создать`,
    DELETE: `${Tg.x0_Symbols.x0_MINUS} Удалить`,
    ERROR: 'Что-то пошло не так. Пожалуйста, попробуйте заново.',
    GET: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить`,
    GET_MORE: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить еще`,
    HELP: 'Используйте кнопки под сообщениями.',
    SELECT: `${Tg.x0_Symbols.x0_CHECK} Выбрать`,
  } as const

  private static readonly x2_Actions = {
    index: Tg.x1_Helpers.create({
      action: 'index',
      buttonText: () => 'index',
    }),

    //
    // needs
    //

    needs: Tg.x1_Helpers.create({
      action: 'needs',
      buttonText: () => 'needs',
    }),

    // create

    needsCreate0_manual: Tg.x1_Helpers.create({
      action: 'needsCreate0_manual',
      buttonText: () => 'needsCreate0_manual',
    }),

    needsCreate1_places: Tg.x1_Helpers.create({
      action: 'needsCreate1_places',
      buttonText: () => 'needsCreate1_places',
    }),

    needsCreate2_place: Tg.x1_Helpers.create<Pick<Need, 'placeId'>>({
      action: 'needsCreate2_place',
      buttonText: ($) => {
        return 'needsCreate2_place'
      },
    }),

    needsCreate3_maxday: Tg.x1_Helpers.create<Pick<Need, 'placeId' | 'maxday'>>({
      action: 'needsCreate3_maxday',
      buttonText: ($) => {
        return 'needsCreate3_maxday'
      },
    }),

    needsCreate4_maxprice: Tg.x1_Helpers.create<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>>({
      action: 'needsCreate4_maxprice',
      buttonText: ($) => {
        return 'needsCreate4_maxprice'
      },
    }),

    // delete

    needsDelete0_manual: Tg.x1_Helpers.create({
      action: 'needsDelete0_manual',
      buttonText: () => 'needsDelete0_manual',
    }),

    needsDelete1_needs: Tg.x1_Helpers.create<Pick<YdbArgs, '_offset'>>({
      action: 'needsDelete1_needs',
      buttonText: ($) => {
        return 'needsDelete1_needs'
      },
    }),

    needsDelete2_need: Tg.x1_Helpers.create<Pick<Need, 'id'>>({
      action: 'needsDelete2_need',
      buttonText: ($) => {
        return 'needsDelete2_need'
      },
    }),

    // list

    needsList: Tg.x1_Helpers.create<Pick<YdbArgs, '_offset'>>({
      action: 'needsList',
      buttonText: ($) => {
        return 'needsList'
      },
    }),

    //
    // trips
    //

    trips: Tg.x1_Helpers.create({
      action: 'trips',
      buttonText: () => 'trips',
    }),

    // create

    tripsCreate0_manual: Tg.x1_Helpers.create({
      action: 'tripsCreate0_manual',
      buttonText: () => 'tripsCreate0_manual',
    }),

    tripsCreate1_capacity: Tg.x1_Helpers.create<Pick<Trip, 'capacity'>>({
      action: 'tripsCreate1_capacity',
      buttonText: ($) => {
        return 'tripsCreate1_capacity'
      },
    }),

    tripsCreate2_day: Tg.x1_Helpers.create<Pick<Trip, 'capacity' | 'day'>>({
      action: 'tripsCreate2_day',
      buttonText: ($) => {
        return 'tripsCreate2_day'
      },
    }),

    tripsCreate3a_places: Tg.x1_Helpers.create<{
      trip: Pick<Trip, 'capacity' | 'day'>
      tripPlaces: Array<Pick<TripPlace, 'minprice' | 'placeId'>>
    }>({
      action: 'tripsCreate3a_places',
      buttonText: ($) => {
        return 'tripsCreate3a_places'
      },
    }),

    tripsCreate3b_place: Tg.x1_Helpers.create<{
      trip: Pick<Trip, 'capacity' | 'day'>
      tripPlaces: Array<Pick<TripPlace, 'minprice' | 'placeId'>>
    }>({
      action: 'tripsCreate3b_place',
      buttonText: ($) => {
        return 'tripsCreate3b_place'
      },
    }),

    tripsCreate3c_minprice: Tg.x1_Helpers.create<{
      trip: Pick<Trip, 'capacity' | 'day'>
      tripPlaces: Array<Pick<TripPlace, 'minprice' | 'placeId'>>
    }>({
      action: 'tripsCreate3c_minprice',
      buttonText: ($) => {
        return 'tripsCreate3c_minprice'
      },
    }),

    // delete

    tripsDelete0_manual: Tg.x1_Helpers.create({
      action: 'tripsDelete0_manual',
      buttonText: () => 'tripsDelete0_manual',
    }),

    tripsDelete1_trips: Tg.x1_Helpers.create<Pick<YdbArgs, '_offset'>>({
      action: 'tripsDelete1_trips',
      buttonText: ($) => {
        return 'tripsDelete1_trips'
      },
    }),

    tripsDelete2_need: Tg.x1_Helpers.create<Pick<Need, 'id'>>({
      action: 'tripsDelete2_need',
      buttonText: ($) => {
        return 'tripsDelete2_need'
      },
    }),

    // list

    tripsList: Tg.x1_Helpers.create<Pick<YdbArgs, '_offset'>>({
      action: 'tripsList',
      buttonText: ($) => {
        return 'tripsList'
      },
    }),
  } as const

  private static setupIndex(telegraf: Telegraf): void {
    const indexActionResponse: TgActionResponse = {
      keyboard: [[Tg.x2_Actions.needs.button(), Tg.x2_Actions.trips.button()]],
      message: Tg.x2_Actions.index.button().text,
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
      await context.reply(Tg.x1_Strings.HELP)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(Tg.x2_Actions.index.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(/.*/, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await context.reply(Tg.x1_Strings.HELP)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.on('message', async (context) => {
      await context.reply(Tg.x1_Strings.HELP)
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
            Tg.x2_Actions.needsCreate0_manual.button(), //
            Tg.x2_Actions.needsDelete0_manual.button(),
          ],
          [Tg.x2_Actions.needsList.button({ _offset: 0 })],
          [Tg.x2_Actions.index.button()],
        ],
        message: Tg.x2_Actions.needs.button().text,
      })
    })

    // create

    telegraf.action(Tg.x2_Actions.needsCreate0_manual.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          [Tg.x2_Actions.needsCreate1_places.button()], //
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsCreate0_manual.button().text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate1_places.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const _limit: number = 32
      const places: Place[] = await ydb.placesSelect({ _limit, _offset: 0 })
      if (places.length === _limit) console.warn('places.length === _limit')

      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          ...places.map((place) => [
            Tg.x2_Actions.needsCreate2_place.button({ placeId: place.id }),
          ]),
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsCreate1_places.button().text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate2_place.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const day: number = 24 * 60 * 60
      const epoch: number = epochFromDate()
      const { placeId } = Tg.x2_Actions.needsCreate2_place.handler.parser(context.match)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          ...[
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
          ].map((maxdays: number[]): TgActionButton[] => {
            return maxdays.map((maxday: number): TgActionButton => {
              return Tg.x2_Actions.needsCreate3_maxday.button({
                maxday: epoch + maxday * day,
                placeId,
              })
            })
          }),
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsCreate2_place.button({ placeId }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate3_maxday.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { maxday, placeId } = Tg.x2_Actions.needsCreate3_maxday.handler.parser(context.match)

      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          ...[
            [5, 10, 15, 20, 25],
            [30, 35, 40, 45, 50],
          ].map((maxprices: number[]): TgActionButton[] => {
            return maxprices.map((maxprice: number): TgActionButton => {
              return Tg.x2_Actions.needsCreate4_maxprice.button({
                maxday,
                maxprice,
                placeId,
              })
            })
          }),
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsCreate3_maxday.button({ maxday, placeId }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate4_maxprice.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { maxday, maxprice, placeId } = Tg.x2_Actions.needsCreate4_maxprice.handler.parser(
        context.match,
      )

      const person: Person | undefined = await ydb.personsSelect({ tgid })
      if (person === undefined) throw new Error('person === undefined')

      await ydb.needsInsert({ maxday, maxprice, personId: person.id, placeId, tgid })
      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.needs.button()]],
        message: Tg.x2_Actions.needsCreate4_maxprice.button({
          maxday,
          maxprice,
          placeId,
        }).text,
      })
    })

    // delete

    telegraf.action(Tg.x2_Actions.needsDelete0_manual.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)
      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          [Tg.x2_Actions.needsDelete1_needs.button({ _offset: 0 })],
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsDelete1_needs.button({ _offset: 0 }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsDelete1_needs.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { _offset } = Tg.x2_Actions.needsDelete1_needs.handler.parser(context.match)

      const _limit: number = 9
      const needs: Need[] = await ydb.needsSelect({ _limit, _offset, tgid })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          ...needs.map((need) => [Tg.x2_Actions.needsDelete2_need.button({ id: need.id })]),
          [
            Tg.x2_Actions.needsDelete1_needs.button({ _offset: Math.max(_offset - _limit, 0) }),
            Tg.x2_Actions.needsDelete1_needs.button({ _offset: _offset + _limit }),
          ],
          [Tg.x2_Actions.needs.button()],
        ],
        message: Tg.x2_Actions.needsDelete1_needs.button({ _offset }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsDelete2_need.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { id } = Tg.x2_Actions.needsDelete2_need.handler.parser(context.match)
      await ydb.needsDelete({ id })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [[Tg.x2_Actions.needs.button()]],
        message: Tg.x2_Actions.needsDelete2_need.button({ id }).text,
      })
    })

    // list

    telegraf.action(Tg.x2_Actions.needsList.handler.pattern, async (context) => {
      await Tg.x1_Helpers.accept(context)

      const { _offset } = Tg.x2_Actions.needsList.handler.parser(context.match)

      const _limit: number = 9
      const needs = await ydb.needsSelect({ _limit, _offset })

      await Tg.x1_Helpers.reply(context, {
        keyboard: [
          [
            Tg.x2_Actions.needsList.button({ _offset: Math.max(_offset - _limit, 0) }),
            Tg.x2_Actions.needsList.button({ _offset: _offset + _limit }),
          ],
          [Tg.x2_Actions.needs.button()],
        ],
        message:
          needs.length === 0
            ? 'Nothing'
            : needs.reduce((message, need) => `${message}\n${need.id}, ${need.placeName}`, ''),
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
