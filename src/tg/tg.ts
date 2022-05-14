// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { Update, User } from '@grammyjs/types'
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
  buttons: Parameters<typeof Markup.inlineKeyboard>[0]
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
    reply: async (context: Context, response: TgActionResponse): Promise<void> => {
      const { buttons, message } = response

      const toEscapedMarkdown = (message: string): string => {
        for (const char of '-()') message = message.replaceAll(char, `\\${char}`)
        return message
      }

      const toNativeButton = (
        button: TgActionButton | TgActionButton[],
      ): // eslint-disable-next-line id-blacklist
      | ReturnType<typeof Markup.button.callback>
        // eslint-disable-next-line id-blacklist
        | Array<ReturnType<typeof Markup.button.callback>> => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        if (Array.isArray(button)) return button.map((b) => toNativeButton(b))
        else {
          const { hidden, payload, text } = button
          return Markup.button.callback(text, payload, hidden)
        }
      }

      await context.replyWithMarkdownV2(
        Tg.x1_Markdown.italic(toEscapedMarkdown(message)),
        Markup.inlineKeyboard(buttons.map(toNativeButton)),
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
    GET: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить`,
    GET_MORE: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить еще`,
    SELECT: `${Tg.x0_Symbols.x0_CHECK} Выбрать`,
  } as const

  private static readonly x2_Actions = (() => {
    //
    // index
    //

    const index: TgAction = {
      createButton: () => ({
        payload: 'index',
        text: 'index',
      }),
      createResponse: () => ({
        buttons: [needs.createButton()],
        message: 'index',
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
        text: 'needs',
      }),
      createResponse: () => ({
        buttons: [
          [needsCreate.createButton(), needsGet.createButton({ _offset: 0 })],
          [index.createButton()],
        ],
        message: 'needs',
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
      handler: {
        parser: () => undefined,
        pattern: /^needs:create$/,
      },
    }

    const needsCreate1_placesGet: TgAction<Pick<YdbArgs, '_offset'>> = {
      createButton: ($) => ({
        hidden: $._offset === Infinity,
        payload: `needs:create1:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.GET} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, _offset]) => ({ _offset: +_offset }),
        pattern: /^needs:create1:_offset=(\d+)$/,
      },
    }

    const needsCreate2_placeSelect: TgAction<Pick<Need, 'placeId'>> = {
      createButton: ($) => ({
        payload: `needs:create2:placeId=${$.placeId}`,
        text: `${Tg.x1_Strings.SELECT} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, placeId]) => ({ placeId }),
        pattern: /^needs:create2:placeId=(\w+)$/,
      },
    }

    const needsCreate3_maxdaySet: TgAction<Pick<Need, 'placeId' | 'maxday'>> = {
      createButton: ($) => ({
        payload: `needs:create3:placeId=${$.placeId}:maxday=${$.maxday}`,
        text: `${Tg.x1_Strings.SELECT} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, placeId, maxday]) => ({
          maxday: +maxday,
          placeId,
        }),
        pattern: /^needs:create3:placeId=(\w+):maxday=(\d+)$/,
      },
    }

    const needsCreate4_maxpriceSet: TgAction<Pick<Need, 'placeId' | 'maxday' | 'maxprice'>> = {
      createButton: ($) => ({
        payload: `needs:create4:placeId=${$.placeId}:maxday=${$.maxday}:maxprice=${$.maxprice}`,
        text: `${Tg.x1_Strings.SELECT} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, placeId, maxday, maxprice]) => ({
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
        text: `${Tg.x1_Strings.DELETE} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, id]) => ({ id }),
        pattern: /^needs:delete:id=(\w+)$/,
      },
    }

    // get

    const needsGet: TgAction<Pick<YdbArgs, '_offset'>> = {
      createButton: ($) => ({
        hidden: $._offset === Infinity,
        payload: `needs:get:_offset=${$._offset}`,
        text: `${Tg.x1_Strings.GET} - ${JSON.stringify($)}`,
      }),
      handler: {
        parser: ([_, _offset]) => ({ _offset: +_offset }),
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
    const indexActionResponse: TgActionResponse = Tg.x2_Actions.index.createResponse!()
    const messageHelp: string = 'Используйте кнопки под сообщениями'

    //

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
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(Tg.x2_Actions.index.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.action(/.*/, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })

    telegraf.on('message', async (context) => {
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, indexActionResponse)
    })
  }

  private static setupNeeds(telegraf: Telegraf): void {
    //

    telegraf.action(Tg.x2_Actions.needs.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.needs.createResponse!())
    })

    // create

    telegraf.action(Tg.x2_Actions.needsCreate.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.x1_Helpers.reply(context, {
        buttons: [Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: 0 })],
        message: 'get places',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate1_placesGet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const _limit: number = 10
      const { _offset } = Tg.x2_Actions.needsCreate1_placesGet.handler.parser(context.match)
      const places: Place[] = await ydb.placesSelect({ _limit, _offset })

      const bs = places.map((place) => [
        Tg.x2_Actions.needsCreate2_placeSelect.createButton({ placeId: place.id }),
      ])

      if (places.length === _limit) {
        bs.push([Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: _offset + _limit })])
      }

      if (places.length < _limit) {
        bs.push([Tg.x2_Actions.needs.createButton()])
      }

      await Tg.x1_Helpers.reply(context, {
        buttons: bs,
        message: 'select',
      })

      // if (places.length === _limit) {
      //   await Tg.x1_Helpers.reply(context, {
      //     buttons: [
      //       Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: _offset + _limit }),
      //       Tg.x2_Actions.needs.createButton(),
      //     ],
      //     message: `get ${_offset + _limit}`,
      //   })
      // }

      // if (places.length < _limit) {
      //   await Tg.x1_Helpers.reply(context, {
      //     buttons: [
      //       Tg.x2_Actions.needsCreate1_placesGet.createButton({ _offset: Infinity }),
      //       Tg.x2_Actions.needs.createButton(),
      //     ],
      //     message: 'end',
      //   })
      // }
    })

    telegraf.action(Tg.x2_Actions.needsCreate2_placeSelect.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { placeId } = Tg.x2_Actions.needsCreate2_placeSelect.handler.parser(context.match)
      await Tg.x1_Helpers.reply(context, {
        buttons: [
          Tg.x2_Actions.needsCreate3_maxdaySet.createButton({ maxday: epochFromDate(), placeId }),
          Tg.x2_Actions.needsCreate3_maxdaySet.createButton({
            maxday: epochFromDate() + 1 * 24 * 60 * 60,
            placeId,
          }),
          Tg.x2_Actions.needsCreate3_maxdaySet.createButton({
            maxday: epochFromDate() + 2 * 24 * 60 * 60,
            placeId,
          }),
          Tg.x2_Actions.needsCreate3_maxdaySet.createButton({
            maxday: epochFromDate() + 3 * 24 * 60 * 60,
            placeId,
          }),
        ],
        message: 'maxday',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate3_maxdaySet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { maxday, placeId } = Tg.x2_Actions.needsCreate3_maxdaySet.handler.parser(context.match)
      await Tg.x1_Helpers.reply(context, {
        buttons: [
          Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({ maxday, maxprice: 1, placeId }),
          Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({ maxday, maxprice: 2, placeId }),
          Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({ maxday, maxprice: 3, placeId }),
          Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({ maxday, maxprice: 4, placeId }),
          Tg.x2_Actions.needsCreate4_maxpriceSet.createButton({ maxday, maxprice: 5, placeId }),
        ],
        message: 'maxprice',
      })
    })

    telegraf.action(Tg.x2_Actions.needsCreate4_maxpriceSet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { maxday, maxprice, placeId } = Tg.x2_Actions.needsCreate4_maxpriceSet.handler.parser(
        context.match,
      )

      const user: User | undefined = context.from
      if (user) {
        const tgid: string = `${user.id}`
        const person = await ydb.personsSelectByTgid({ tgid })
        if (person) {
          await ydb.needsInsert({ maxday, maxprice, personId: person.id, placeId, tgid })
          return await Tg.x1_Helpers.reply(context, {
            buttons: [Tg.x2_Actions.needs.createButton()],
            message: 'hvala',
          })
        }
      }

      await Tg.x1_Helpers.reply(context, {
        buttons: [Tg.x2_Actions.needs.createButton()],
        message: 'wtf',
      })
    })

    // delete

    telegraf.action(Tg.x2_Actions.needsDelete.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { id } = Tg.x2_Actions.needsDelete.handler.parser(context.match)
      await ydb.needsDelete({ id })
      await context.deleteMessage()
    })

    // get

    telegraf.action(Tg.x2_Actions.needsGet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

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
            buttons: [Tg.x2_Actions.needsDelete.createButton({ id })],
            message: `${Tg.x1_Markdown.bold(id)} ${Tg.x0_Symbols.x0_DOT} ${placeName}`,
          })
        }

        if (needs.length === _limit) {
          await Tg.x1_Helpers.reply(context, {
            buttons: [
              Tg.x2_Actions.needsGet.createButton({ _offset: _offset + _limit }),
              Tg.x2_Actions.needs.createButton(),
            ],
            message: 'next',
          })
        }

        if (needs.length < _limit) {
          await Tg.x1_Helpers.reply(context, {
            buttons: [
              Tg.x2_Actions.needsGet.createButton({ _offset: Infinity }),
              Tg.x2_Actions.needs.createButton(),
            ],
            message: 'end',
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
