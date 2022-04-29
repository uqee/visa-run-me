// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { Update, User } from '@grammyjs/types'
import { Context, Markup, Telegraf } from 'telegraf'

import { Country, Place, ydb, YdbArgs } from '../ydb'

interface TgAction {
  button: {
    hidden?: boolean
    payload: string
    text: string
  }
  reply?: {
    buttons: Parameters<typeof Markup.inlineKeyboard>[0]
    message: string
  }
}

interface TgActionFactory<TArgs extends object | void = void> {
  (args: TArgs): TgAction
  handler: {
    parse: (contextMatch: string[]) => TArgs
    pattern: RegExp
  }
}

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
    // eslint-disable-next-line id-blacklist
    button: (action: TgAction): ReturnType<typeof Markup.button.callback> => {
      return Markup.button.callback(action.button.text, action.button.payload, action.button.hidden)
    },

    keyboard: (
      buttons: Parameters<typeof Markup.inlineKeyboard>[0],
    ): ReturnType<typeof Markup.inlineKeyboard> => {
      return Markup.inlineKeyboard(buttons)
    },

    reply: async (context: Context, action: TgAction): Promise<void> => {
      if (action.reply) {
        await context.replyWithMarkdownV2(
          Tg.x1_Markdown.italic(action.reply.message),
          Markup.inlineKeyboard(action.reply.buttons),
        )
      }
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
    CHOOSE: `${Tg.x0_Symbols.x0_CHECK} Выбрать`,
    CREATE: `${Tg.x0_Symbols.x0_PLUS} Добавить`,
    DELETE: `${Tg.x0_Symbols.x0_MINUS} Удалить`,
    GET: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить`,
    GET_MORE: `${Tg.x0_Symbols.x0_ARROW_DOWN} Загрузить еще`,
  } as const

  private static readonly x2_Actions = (() => {
    const _indexButtonPattern: RegExp = /^index$/
    const _indexButtonPayload: string = 'index'
    const _indexButtonText: string = `${Tg.x0_Symbols.x0_QUOTE_DOUBLE_RIGHT} Дом`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const _indexButton = Tg.x1_Helpers.button({
      button: {
        payload: _indexButtonPayload,
        text: _indexButtonText,
      },
    })

    //
    // places
    //

    const placesCreateStep0: TgActionFactory = () => ({
      button: {
        payload: 'places:create:step=0',
        text: Tg.x1_Strings.CREATE,
      },
    })

    placesCreateStep0.handler = {
      parse: () => undefined,
      pattern: /^places:create:step=0$/,
    }

    //

    const placesCreateStep1: TgActionFactory<Pick<Country, 'id'>> = ($) => ({
      button: {
        payload: `places:create:step=1:id=${$.id}`,
        text: Tg.x1_Strings.CHOOSE,
      },
    })

    placesCreateStep1.handler = {
      parse: ([_, id]) => ({ id }),
      pattern: /^places:create:step=1:id=(\w+)$/,
    }

    //

    const placesDelete: TgActionFactory<Pick<Place, 'id'>> = ($) => ({
      button: {
        payload: `places:delete:id=${$.id}`,
        text: Tg.x1_Strings.DELETE,
      },
    })

    placesDelete.handler = {
      parse: ([_, id]) => ({ id }),
      pattern: /^places:delete:id=(\w+)$/,
    }

    //

    const placesGet: TgActionFactory<Pick<YdbArgs, '_offset'>> = ($) => ({
      button: {
        hidden: $._offset === Infinity,
        payload: `places:get:_offset=${$._offset}`,
        text: $._offset === 0 ? Tg.x1_Strings.GET : Tg.x1_Strings.GET_MORE,
      },
    })

    placesGet.handler = {
      parse: ([_, _offset]) => ({ _offset: +_offset }),
      pattern: /^places:get:_offset=(\d+)$/,
    }

    //

    const places: TgActionFactory<Pick<YdbArgs, '_offset'>> = ($) => ({
      button: {
        payload: `places:_offset=${$._offset}`,
        text: `${Tg.x0_Symbols.x0_QUOTE_RIGHT} Места`,
      },
      reply: {
        buttons: [
          [Tg.x1_Helpers.button(placesCreateStep0()), Tg.x1_Helpers.button(placesGet($))],
          [_indexButton],
        ],
        message: `${Tg.x0_Symbols.x0_QUOTE_RIGHT} Места`,
      },
    })

    places.handler = {
      parse: ([_, _offset]) => ({ _offset: +_offset }),
      pattern: /^places:_offset=(\d+)$/,
    }

    //
    // index
    //

    const index: TgActionFactory = () => ({
      button: {
        payload: _indexButtonPayload,
        text: _indexButtonText,
      },
      reply: {
        buttons: [[Tg.x1_Helpers.button(places({ _offset: 0 }))]],
        message: _indexButtonText,
      },
    })

    index.handler = {
      parse: () => undefined,
      pattern: _indexButtonPattern,
    }

    //
    //
    //

    return {
      index,
      places,
      placesCreateStep0,
      placesCreateStep1,
      placesDelete,
      placesGet,
    } as const
  })()

  private static setupIndex(telegraf: Telegraf): void {
    const actionIndex: TgAction = Tg.x2_Actions.index()
    const messageHelp: string = 'Используйте кнопки под сообщениями'

    telegraf.start(async (context) => {
      const tgid: string = `${context.from.id}`
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person = await ydb.personsSelectByTgid({ tgid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, tgname })
      else await ydb.personsInsert({ firstname, lastname, tgid, tgname })

      await context.reply(`Dobro došli, ${firstname} ${Tg.x0_Symbols.x3_HEART}`)
      await Tg.x1_Helpers.reply(context, actionIndex)
    })

    telegraf.help(async (context) => {
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, actionIndex)
    })

    telegraf.command('feedback', async (context) => {
      await context.reply('Оставьте отзыв или предложение @denis_zhbankov')
      await Tg.x1_Helpers.reply(context, actionIndex)
    })

    //

    telegraf.action(Tg.x2_Actions.index.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.x1_Helpers.reply(context, actionIndex)
    })

    //

    telegraf.action(/.*/, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, actionIndex)
    })

    telegraf.on('message', async (context) => {
      await context.reply(messageHelp)
      await Tg.x1_Helpers.reply(context, actionIndex)
    })
  }

  private static setupPlaces(telegraf: Telegraf): void {
    //
    telegraf.action(Tg.x2_Actions.places.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.places({ _offset: 0 }))
    })

    telegraf.action(Tg.x2_Actions.placesCreateStep0.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const countries: Country[] = await ydb.countriesSelect({ _limit: 10, _offset: 0 })
      for (const country of countries) {
        const { id, name } = country
        await context.replyWithMarkdownV2(
          name,
          Tg.x1_Helpers.keyboard([[Tg.x1_Helpers.button(Tg.x2_Actions.placesCreateStep1({ id }))]]),
        )
      }
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.places({ _offset: 0 }))
    })

    telegraf.action(Tg.x2_Actions.placesCreateStep1.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { id } = Tg.x2_Actions.placesCreateStep1.handler.parse(context.match)
      await context.reply(`${id}: Напишите, как называется новое место?`)
      await Tg.x1_Helpers.reply(context, Tg.x2_Actions.places({ _offset: 0 }))
    })

    telegraf.action(Tg.x2_Actions.placesDelete.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const { id } = Tg.x2_Actions.placesDelete.handler.parse(context.match)
      await ydb.placesDelete({ id })
      await context.deleteMessage()
    })

    telegraf.action(Tg.x2_Actions.placesGet.handler.pattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const user: User | undefined = context.from
      if (user) {
        //
        const _limit: number = 5
        const { _offset } = Tg.x2_Actions.placesGet.handler.parse(context.match)
        const tgid: string = `${user.id}`
        const places = await ydb.placesSelectByTgid({ _limit, _offset, tgid })

        for (const place of places) {
          const { countryName, id, name } = place
          await context.replyWithMarkdownV2(
            `${Tg.x1_Markdown.bold(countryName)} ${Tg.x0_Symbols.x0_DOT} ${name}`,
            Tg.x1_Helpers.keyboard([[Tg.x1_Helpers.button(Tg.x2_Actions.placesDelete({ id }))]]),
          )
        }

        if (places.length === _limit) {
          await Tg.x1_Helpers.reply(context, Tg.x2_Actions.places({ _offset: _offset + _limit }))
        }

        if (places.length < _limit) {
          await Tg.x1_Helpers.reply(context, Tg.x2_Actions.places({ _offset: Infinity }))
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

    Tg.setupPlaces(telegraf)
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
