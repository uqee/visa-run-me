// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardMarkup, Update, User } from '@grammyjs/types'
import { Composer, Context, Markup, Scenes, Telegraf } from 'telegraf'

import { ydb } from '../ydb'
import { session } from './session'

// context.scene.session.my2cents
interface TgWizardSession extends Scenes.WizardSessionData {
  my2cents: number
}

// context.session.my2cents
interface TgSession extends Scenes.WizardSession<TgWizardSession> {
  my2cents: number
}

// context.my2cents
interface TgContext extends Context {
  my2cents: number

  scene: Scenes.SceneContextScene<TgContext, TgWizardSession>
  session: TgSession
  wizard: Scenes.WizardContextWizard<TgContext>
}

interface TgRoute {
  actionCode: string
  actionName: string
  actionPattern: RegExp
  keyboard?: Markup.Markup<InlineKeyboardMarkup>
}

class Tg {
  private static readonly $ymbols = {
    ARROW_DOWN: '↓',
    ARROW_LEFT: '←',
    ARROW_RIGHT: '→',
    ARROW_UP: '↑',
    CHECKMARK: '✓',
    DOT: '⋅',
    HEART: '♥',
    MINUS: '−',
    MULT: '×',
    PLUS: '+',
    QUOTE_DOUBLE_LEFT: '«',
    QUOTE_DOUBLE_RIGHT: '»',
    QUOTE_LEFT: '‹',
    QUOTE_RIGHT: '›',
  } as const

  private static readonly Constants = {
    R_ANY_ACTION: /.*/,
    S_CREATE: `${Tg.$ymbols.PLUS} Добавить`,
    S_DELETE: `${Tg.$ymbols.MINUS} Удалить`,
    S_FEEDBACK: 'Оставьте отзыв или предложение @denis_zhbankov',
    S_GET: `${Tg.$ymbols.ARROW_DOWN} Загрузить`,
    S_GET_MORE: `${Tg.$ymbols.ARROW_DOWN} Загрузить еще`,
    S_GET_OK: `${Tg.$ymbols.CHECKMARK} Загружено`,
    S_HELP: 'Используйте кнопки под сообщениями',
  } as const

  private static readonly Markdown = {
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

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private static readonly Routes = (() => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */

    const HOME: TgRoute = {
      actionCode: 'HOME',
      actionName: `${Tg.$ymbols.QUOTE_DOUBLE_RIGHT} Дом`,
      actionPattern: /^HOME$/,
    }

    //

    const HOME_PLACES_CREATE: TgRoute = {
      actionCode: 'HOME_PLACES_CREATE',
      actionName: Tg.Constants.S_CREATE,
      actionPattern: /^HOME_PLACES_CREATE$/,
    }

    //

    const HOME_PLACES_DELETE = (id: string = ''): TgRoute => ({
      actionCode: `HOME_PLACES_DELETE:${id}`,
      actionName: Tg.Constants.S_DELETE,
      actionPattern: /^HOME_PLACES_DELETE:(\w+)$/,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            Tg.Constants.S_DELETE, //
            `HOME_PLACES_DELETE:${id}`,
          ),
        ],
      ]),
    })
    const HOME_PLACES_DELETE_ = HOME_PLACES_DELETE()

    //

    const HOME_PLACES_GET = (offset: number = 0): TgRoute => ({
      actionCode: `HOME_PLACES_GET:${offset}`,
      actionName: offset === 0 ? Tg.Constants.S_GET : Tg.Constants.S_GET_MORE,
      actionPattern: /^HOME_PLACES_GET:(\d+)$/,
    })
    const HOME_PLACES_GET_ = HOME_PLACES_GET()

    //

    const HOME_PLACES = (offset: number = 0): TgRoute => ({
      actionCode: 'HOME_PLACES',
      actionName: `${HOME.actionName} ${Tg.$ymbols.QUOTE_RIGHT} Места`,
      actionPattern: /^HOME_PLACES$/,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            HOME_PLACES_CREATE.actionName, //
            HOME_PLACES_CREATE.actionCode,
          ),
          Markup.button.callback(
            HOME_PLACES_GET(offset).actionName,
            HOME_PLACES_GET(offset).actionCode,
            offset === Infinity,
          ),
        ],
        [
          Markup.button.callback(
            HOME.actionName, //
            HOME.actionCode,
          ),
        ],
      ]),
    })
    const HOME_PLACES_ = HOME_PLACES()

    //

    HOME.keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          HOME_PLACES_.actionName, //
          HOME_PLACES_.actionCode,
        ),
      ],
    ])

    //

    return {
      HOME, //
      HOME_PLACES,
      HOME_PLACES_,
      HOME_PLACES_CREATE,
      HOME_PLACES_DELETE,
      HOME_PLACES_DELETE_,
      HOME_PLACES_GET,
      HOME_PLACES_GET_,
    } as const

    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  })()

  private static setupCommands(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.start(async (context) => {
      const tgid: string = `${context.from.id}`
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person = await ydb.personsSelectByTgid({ tgid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, tgname })
      else await ydb.personsInsert({ firstname, lastname, tgid, tgname })

      await context.reply(`Dobro došli, ${firstname} ${Tg.$ymbols.HEART}`)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })

    telegraf.help(async (context) => {
      await context.reply(Tg.Constants.S_HELP)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })

    telegraf.command('feedback', async (context) => {
      await context.reply(Tg.Constants.S_FEEDBACK)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })
  }

  private static setupFallbacks(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Constants.R_ANY_ACTION, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.reply(Tg.Constants.S_HELP)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })

    telegraf.on('message', async (context) => {
      await context.reply(Tg.Constants.S_HELP)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })
  }

  private static setupHome(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Routes.HOME.actionCode, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME.actionName), //
        Tg.Routes.HOME.keyboard,
      )
    })
  }

  private static setupPlaces(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Routes.HOME_PLACES_.actionCode, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(Tg.Routes.HOME_PLACES_.actionName), //
        Tg.Routes.HOME_PLACES_.keyboard,
      )
    })

    telegraf.action(Tg.Routes.HOME_PLACES_CREATE.actionPattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.scene.enter(Tg.Routes.HOME_PLACES_CREATE.actionCode)
    })

    telegraf.action(Tg.Routes.HOME_PLACES_DELETE_.actionPattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const id: string = context.match[1]
      const user: User | undefined = context.from
      if (user) {
        await ydb.placesDelete({ id })
        await context.deleteMessage()
      }
    })

    telegraf.action(Tg.Routes.HOME_PLACES_GET_.actionPattern, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)

      const user: User | undefined = context.from
      if (user) {
        //
        const _limit: number = 5
        const _offset: number = +context.match[1]
        const tgid: string = `${user.id}`
        const places = await ydb.placesSelectByTgid({ _limit, _offset, tgid })

        for (const place of places) {
          const { countryName, id, name } = place
          const { keyboard } = Tg.Routes.HOME_PLACES_DELETE(id)
          await context.replyWithMarkdownV2(
            `${Tg.Markdown.bold(countryName)} ${Tg.$ymbols.DOT} ${name}`, //
            keyboard,
          )
        }

        if (places.length === _limit) {
          const { actionName, keyboard } = Tg.Routes.HOME_PLACES(_offset + _limit)
          await context.replyWithMarkdownV2(
            Tg.Markdown.italic(actionName), //
            keyboard,
          )
        }

        if (places.length < _limit) {
          const { keyboard } = Tg.Routes.HOME_PLACES(Infinity)
          await context.replyWithMarkdownV2(
            Tg.Markdown.italic(Tg.Constants.S_GET_OK), //
            keyboard,
          )
        }
      }
    })
  }

  private static setupPlacesCreate(): Scenes.WizardScene<TgContext> {
    //

    const composer = new Composer<TgContext>()

    composer.action('next', async (ctx) => {
      ctx.scene.session.my2cents = Math.floor(10 * Math.random())
      ctx.session.my2cents = -Math.floor(10 * Math.random())
      await ctx.reply('Step 2. Via inline button')
      return ctx.wizard.next()
    })

    composer.command('next', async (ctx) => {
      ctx.scene.session.my2cents = Math.floor(10 * Math.random()) + 10
      ctx.session.my2cents = -Math.floor(10 * Math.random()) - 10
      await ctx.reply('Step 2. Via command')
      return ctx.wizard.next()
    })

    composer.use(async (ctx) => {
      await ctx.replyWithMarkdown('Press `Next` button or type /next')
    })

    //

    const scene = new Scenes.WizardScene<TgContext>(
      Tg.Routes.HOME_PLACES_CREATE.actionCode,

      async (ctx) => {
        await ctx.reply(
          'Step 1',
          Markup.inlineKeyboard([
            Markup.button.url('❤️', 'http://telegraf.js.org'),
            Markup.button.callback('➡️ Next', 'next'),
          ]),
        )
        return ctx.wizard.next()
      },

      composer,

      async (ctx) => {
        const responseText = [
          'Step 3',
          `ctx.my2cents is ${ctx.my2cents}`,
          `ctx.session.my2cents is ${ctx.session.my2cents}`,
          `ctx.scene.session.my2cents === ${ctx.scene.session.my2cents}`,
        ].join('\n')
        await ctx.reply(responseText)
        return ctx.wizard.next()
      },

      async (ctx) => {
        await ctx.reply('Step 4')
        return ctx.wizard.next()
      },

      async (ctx) => {
        await ctx.reply('Done')
        return await ctx.scene.leave()
      },
    )

    return scene
  }

  private debug: boolean | undefined
  private telegraf: Telegraf<TgContext> | undefined

  public async _execute(update: Update): Promise<void> {
    if (this.debug) console.log('TG : update', JSON.stringify(update))
    await this.telegraf?.handleUpdate(update)
  }

  public _setup(tgBotToken: string, debug: boolean): void {
    const telegraf: Telegraf<TgContext> = new Telegraf<TgContext>(tgBotToken)

    telegraf.use(async (context, next) => {
      if (debug) console.log('TG : context', JSON.stringify(context))
      context.my2cents = Date.now()
      return next()
    })

    const stage = new Scenes.Stage<TgContext>([
      Tg.setupPlacesCreate(), //
    ])

    telegraf.use(session())
    telegraf.use(stage.middleware())

    Tg.setupCommands(telegraf)
    Tg.setupHome(telegraf)
    Tg.setupPlaces(telegraf)
    Tg.setupFallbacks(telegraf)

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    this.debug = debug
    this.telegraf = telegraf
  }
}

export const tg: Tg = new Tg()
