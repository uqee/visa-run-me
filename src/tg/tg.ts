// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardButton, Update, User } from '@grammyjs/types'
import { Context, Markup, Telegraf } from 'telegraf'

import { epochFromDate } from '../utils'
import { Need, Person, Place, Tgid, ydb, YdbArgs } from '../ydb'

//

interface TgActionButton {
  hidden?: boolean
  payload: string
  text: string
}

interface TgActionHandler<TArgs extends object | void = void> {
  parser: (contextMatch: string[]) => TArgs
  pattern: RegExp
}

interface TgActionResponse {
  keyboard: TgActionButton[][]
  message: string
}

interface TgAction<TArgs extends object | void = void> {
  button: (args: TArgs) => TgActionButton
  handler: TgActionHandler<TArgs>
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
      for (const char of '+-()') message = message.replaceAll(char, `\\${char}`)
      return message
    },

    accept: async (context: Context): Promise<void> => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
    },

    getTgid: (context: Context): Tgid | never => {
      const user: User | undefined = context.from
      if (user === undefined) throw new Error('user === undefined')
      const tgid: Tgid = `${user.id}`
      return tgid
    },

    reply: async (context: Context, response: TgActionResponse): Promise<void> => {
      const { keyboard: buttons, message } = response
      await context.replyWithMarkdownV2(
        Tg.x1_Helpers._toEscapedMarkdown(message),
        Markup.inlineKeyboard(Tg.x1_Helpers._toCallbackButtons(buttons)),
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

  private static readonly x2_Actions = (() => {
    //
    // index
    //

    const index: TgAction = {
      button: () => ({
        payload: 'index',
        text: `${Tg.x0_Symbols.x2_ARROWHEAD} Home`,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^index$/,
      },
    }

    //
    // needs
    //

    const needs: TgAction = {
      button: () => ({
        payload: 'needs',
        text: `${Tg.x0_Symbols.x2_ARROWHEAD} Needs`,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs$/,
      },
    }

    // create

    const needsCreate0_manual: TgAction = {
      button: () => ({
        payload: 'needs:create0',
        text: Tg.x1_Strings.CREATE,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs:create0$/,
      },
    }

    const needsCreate1_places: TgAction = {
      button: () => ({
        payload: 'needs:create1',
        text: `${Tg.x1_Strings.GET}`,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs:create1$/,
      },
    }

    const needsCreate2_place: TgAction<Pick<Need, 'placeId'>> = {
      button: ($) => ({
        payload: `needs:create2:placeId=${$.placeId}`,
        text: `${Tg.x1_Strings.SELECT}: ${$.placeId}`,
      }),
      handler: {
        parser: ([, placeId]) => ({ placeId }),
        pattern: /^needs:create2:placeId=(\w+)$/,
      },
    }

    const needsCreate3_maxday: TgAction<Pick<Need, 'placeId' | 'maxday'>> = {
      button: ($) => ({
        payload: `needs:create3:placeId=${$.placeId}:maxday=${$.maxday}`,
        text: `${Tg.x1_Strings.SELECT}: ${$.placeId}, ${$.maxday}`,
      }),
      handler: {
        parser: ([, placeId, maxday]) => ({
          maxday: +maxday,
          placeId,
        }),
        pattern: /^needs:create3:placeId=(\w+):maxday=(\d+)$/,
      },
    }

    const needsCreate4_maxprice: TgAction<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>> = {
      button: ($) => ({
        payload: `needs:create4:placeId=${$.placeId}:maxday=${$.maxday}:maxprice=${$.maxprice}`,
        text: `${Tg.x1_Strings.SELECT}: ${$.placeId}, ${$.maxday}, ${$.maxprice}`,
      }),
      handler: {
        parser: ([, placeId, maxday, maxprice]) => ({
          maxday: +maxday,
          maxprice: +maxprice,
          placeId,
        }),
        pattern: /^needs:create4:placeId=(\w+):maxday=(\d+):maxprice=(\d+)$/,
      },
    }

    // delete

    const needsDelete0_manual: TgAction = {
      button: () => ({
        payload: 'needs:delete0',
        text: `${Tg.x1_Strings.DELETE}`,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs:delete0$/,
      },
    }

    const needsDelete1_needs: TgAction<Pick<YdbArgs, '_offset'>> = {
      button: ($) => ({
        payload: `needs:delete1:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.DELETE}: ${$._offset}`,
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^needs:delete1:_offset=(\d+)$/,
      },
    }

    const needsDelete2_need: TgAction<Pick<Need, 'id'>> = {
      button: ($) => ({
        payload: `needs:delete2:needId=${$.id}`,
        text: `${Tg.x1_Strings.DELETE}: ${$.id}`,
      }),
      handler: {
        parser: ([, id]) => ({ id }),
        pattern: /^needs:delete2:needId=(\w+)$/,
      },
    }

    // list

    const needsList: TgAction<Pick<YdbArgs, '_offset'>> = {
      button: ($) => ({
        payload: `needs:list:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.GET}: ${$._offset}`,
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^needs:list:_offset=(\d+)$/,
      },
    }

    //
    //
    //

    return {
      index,

      needs,
      needsCreate0_manual,
      needsCreate1_places,
      needsCreate2_place,
      needsCreate3_maxday,
      needsCreate4_maxprice,
      needsDelete0_manual,
      needsDelete1_needs,
      needsDelete2_need,
      needsList,
    } as const
  })()

  private static setupIndex(telegraf: Telegraf): void {
    const indexActionResponse: TgActionResponse = {
      keyboard: [[Tg.x2_Actions.needs.button()]],
      message: Tg.x2_Actions.index.button().text,
    }

    telegraf.start(async (context) => {
      const tgid: Tgid = Tg.x1_Helpers.getTgid(context)
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person = await ydb.personsSelectByTgid({ tgid })
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

      const person: Person | undefined = await ydb.personsSelectByTgid({ tgid })
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
      const needs: Need[] = await ydb.needsSelectByTgid({ _limit, _offset, tgid })

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
            : needs.reduce(
                (message, need) =>
                  `${message}\n${Tg.x1_Markdown.monospace(need.id)}, ${need.placeName}`,
                '',
              ),
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
      if (debug) console.log('TG : error', JSON.stringify(error))
      throw error
    })

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    this.debug = debug
    this.telegraf = telegraf
  }
}

export const tg: Tg = new Tg()
