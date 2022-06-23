// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardButton, Update, User } from '@grammyjs/types'
import { Context, Markup, Telegraf } from 'telegraf'

import { epochFromDate } from '../utils'
import { Need, Place, ydb, YdbArgs } from '../ydb'

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
  buttons: TgActionButton[][]
  message: string
}

interface TgAction<TArgs extends object | void = void> {
  createButton: (args: TArgs) => TgActionButton
  createResponse?: (args: TArgs) => TgActionResponse
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

    reply: async (context: Context, response: TgActionResponse): Promise<void> => {
      const { buttons, message } = response
      await context.replyWithMarkdownV2(
        Tg.x1_Helpers._toEscapedMarkdown(message),
        Markup.inlineKeyboard(Tg.x1_Helpers._toCallbackButtons(buttons)),
      )
    },

    // standardHandler:
    //   (response: TgActionResponse | undefined) =>
    //   async (context: Context): Promise<void> => {
    //     await context.answerCbQuery()
    //     await context.editMessageReplyMarkup(undefined)
    //     await Tg.x1_Helpers.reply(context, response ?? Tg.x2_Actions.index.createResponse!())
    //   },
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
      createButton: () => ({
        payload: 'index',
        text: `${Tg.x0_Symbols.x2_ARROWHEAD} Home`,
      }),
      createResponse: () => ({
        buttons: [[needs.createButton()]],
        message: index.createButton().text,
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
      createButton: () => ({
        payload: 'needs',
        text: `${Tg.x0_Symbols.x2_ARROWHEAD} Needs`,
      }),
      createResponse: () => ({
        buttons: [
          [
            needsCreate.createButton(), //
            needsGet.createButton({ _offset: 0 }),
          ],
          [index.createButton()],
        ],
        message: needs.createButton().text,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs$/,
      },
    }

    // create

    const needsCreate: TgAction = {
      createButton: () => ({
        payload: 'needs:create',
        text: Tg.x1_Strings.CREATE,
      }),
      createResponse: () => ({
        buttons: [[Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: 0 })]],
        message: Tg.x2_Actions.needsCreate.createButton().text,
      }),
      handler: {
        parser: () => undefined,
        pattern: /^needs:create$/,
      },
    }

    const needsCreate1_placesGet: TgAction<Pick<YdbArgs, '_offset'>> = {
      createButton: ($) => ({
        hidden: $._offset === Infinity,
        payload: `needs:create1:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.GET}: ${$._offset}`,
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^needs:create1:_offset=(\d+)$/,
      },
    }

    const needsCreate2_placeSelect: TgAction<Pick<Need, 'placeId'>> = {
      createButton: ($) => ({
        payload: `needs:create2:placeId=${$.placeId}`,
        text: `${Tg.x1_Strings.SELECT}: ${$.placeId}`,
      }),
      handler: {
        parser: ([, placeId]) => ({ placeId }),
        pattern: /^needs:create2:placeId=(\w+)$/,
      },
    }

    const needsCreate3_maxdaySet: TgAction<Pick<Need, 'placeId' | 'maxday'>> = {
      createButton: ($) => ({
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

    const needsCreate4_maxpriceSet: TgAction<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>> = {
      createButton: ($) => ({
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

    const needsDelete: TgAction<Pick<Need, 'id'>> = {
      createButton: ($) => ({
        payload: `needs:delete:id=${$.id}`,
        text: `${Tg.x1_Strings.DELETE}: ${$.id}`,
      }),
      handler: {
        parser: ([, id]) => ({ id }),
        pattern: /^needs:delete:id=(\w+)$/,
      },
    }

    // get

    const needsGet: TgAction<Pick<YdbArgs, '_offset'>> = {
      createButton: ($) => ({
        hidden: $._offset === Infinity,
        payload: `needs:get:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.GET}: ${$._offset}`,
      }),
      handler: {
        parser: ([, _offset]) => ({ _offset: +_offset }),
        pattern: /^needs:get:_offset=(\d+)$/,
      },
    }

    //
    //
    //

    return {
      index,

      needs,
      needsCreate,
      needsCreate1_placesGet,
      needsCreate2_placeSelect,
      needsCreate3_maxdaySet,
      needsCreate4_maxpriceSet,
      needsDelete,
      needsGet,
    } as const
  })()

  private static setupIndex(telegraf: Telegraf): void {
    const indexActionResponse: TgActionResponse | undefined = Tg.x2_Actions.index.createResponse!()

    telegraf.start(async (context) => {
      const tgid: string = `${context.from.id}`
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
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(/.*/, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
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
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.needs.createResponse!())
    })

    // create

    telegraf.action(Tg.x2_Actions.needsCreate.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.needsCreate.createResponse!())
    })

    telegraf.action(Tg.x2_Actions.needsCreate1_placesGet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const _limit: number = 10
      const { _offset } = Tg.x2_Actions.needsCreate1_placesGet.handler.parser(context.match)
      const places: Place[] = await ydb.placesSelect({ _limit, _offset })

      const buttons: TgActionButton[][] = places.map((place) => [
        Tg.x2_Actions.needsCreate2_placeSelect.createButton({ placeId: place.id }),
      ])

      if (places.length === _limit) {
        buttons.push([
          Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: _offset + _limit }),
        ])
      }

      if (places.length < _limit) {
        buttons.push([Tg.x2_Actions.needs.createButton()])
      }

      await Tg.x1_Helpers.reply(context, {
        buttons,
        message: Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate2_placeSelect.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const day: number = 24 * 60 * 60
      const epoch: number = epochFromDate()
      const { placeId } = Tg.x2_Actions.needsCreate2_placeSelect.handler.parser(context.match)
      await Tg.x1_Helpers.reply(context, {
        buttons: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
        ].map((maxdays: number[]): TgActionButton[] => {
          return maxdays.map((maxday: number): TgActionButton => {
            return Tg.x2_Actions.needsCreate3_maxdaySet.createButton({
              maxday: epoch + maxday * day,
              placeId,
            })
          })
        }),
        message: Tg.x2_Actions.needsCreate2_placeSelect.createButton({ placeId }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate3_maxdaySet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const { maxday, placeId } = Tg.x2_Actions.needsCreate3_maxdaySet.handler.parser(context.match)
      await Tg.x1_Helpers.reply(context, {
        buttons: [
          [5, 10, 15, 20, 25],
          [30, 35, 40, 45, 50],
        ].map((maxprices: number[]): TgActionButton[] => {
          return maxprices.map((maxprice: number): TgActionButton => {
            return Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({
              maxday,
              maxprice,
              placeId,
            })
          })
        }),
        message: Tg.x2_Actions.needsCreate3_maxdaySet.createButton({ maxday, placeId }).text,
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate4_maxpriceSet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const { maxday, maxprice, placeId } = Tg.x2_Actions.needsCreate4_maxpriceSet.handler.parser(
        context.match,
      )

      const user: User | undefined = context.from
      if (user) {
        const tgid: string = `${user.id}`
        const person = await ydb.personsSelectByTgid({ tgid })
        if (person) {
          await ydb.needsInsert({ maxday, maxprice, personId: person.id, placeId, tgid })
          await Tg.x1_Helpers.reply(context, {
            buttons: [[Tg.x2_Actions.needs.createButton()]],
            message: Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({
              maxday,
              maxprice,
              placeId,
            }).text,
          })
        }
      }
    })

    // delete

    telegraf.action(Tg.x2_Actions.needsDelete.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const { id } = Tg.x2_Actions.needsDelete.handler.parser(context.match)
      await ydb.needsDelete({ id })
      await context.deleteMessage()
    })

    // get

    telegraf.action(Tg.x2_Actions.needsGet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(undefined)

      const user: User | undefined = context.from
      if (user) {
        //
        const _limit: number = 10
        const { _offset } = Tg.x2_Actions.needsGet.handler.parser(context.match)
        // const tgid: string = `${user.id}`
        const needs = await ydb.needsSelect({ _limit, _offset })

        for (const need of needs) {
          const { id, placeName } = need
          await Tg.x1_Helpers.reply(context, {
            buttons: [[Tg.x2_Actions.needsDelete.createButton({ id })]],
            message: `${Tg.x1_Markdown.code(id)} ${Tg.x0_Symbols.x0_DOT} ${placeName}`,
          })
        }

        if (needs.length === _limit) {
          await Tg.x1_Helpers.reply(context, {
            buttons: [
              [
                Tg.x2_Actions.needsGet.createButton({ _offset: _offset + _limit }),
                Tg.x2_Actions.needs.createButton(),
              ],
            ],
            message: Tg.x2_Actions.needsGet.createButton({ _offset }).text,
          })
        }

        if (needs.length < _limit) {
          await Tg.x1_Helpers.reply(context, {
            buttons: [
              [
                Tg.x2_Actions.needsGet.createButton({ _offset: Infinity }),
                Tg.x2_Actions.needs.createButton(),
              ],
            ],
            message: Tg.x2_Actions.needsGet.createButton({ _offset }).text,
          })
        }
      }
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
