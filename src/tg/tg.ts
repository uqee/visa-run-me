// https://github.com/telegraf/telegraf/blob/v4/docs/examples/wizards/wizard-bot-custom-context-and-session-and-scene-session.ts

/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */

import { InlineKeyboardMarkup, Update, User } from '@grammyjs/types'
import { Composer, Context, Markup, Scenes, Telegraf } from 'telegraf'

import { ydb } from '../ydb'
import { session } from './session'

// context.scene.session
interface TgWizardSession extends Scenes.WizardSessionData {}

// context.session
interface TgSession extends Scenes.WizardSession<TgWizardSession> {}

// context
interface TgContext extends Context {
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

  private static readonly Constants = {
    R_ANY_ACTION: /.*/,
    S_CREATE: `${Tg.$ymbols.x0_PLUS} Добавить`,
    S_DELETE: `${Tg.$ymbols.x0_MINUS} Удалить`,
    S_FEEDBACK: 'Оставьте отзыв или предложение @denis_zhbankov',
    S_GET: `${Tg.$ymbols.x0_ARROW_DOWN} Загрузить`,
    S_GET_MORE: `${Tg.$ymbols.x0_ARROW_DOWN} Загрузить еще`,
    S_HELP: 'Используйте кнопки под сообщениями',
  } as const

  private static readonly Helpers = {
    getSceneState: <T extends object>(context: TgContext): T => context.scene.state as T,
    replyRoute: async (context: TgContext, route: TgRoute): Promise<void> => {
      await context.replyWithMarkdownV2(
        Tg.Markdown.italic(route.actionName), //
        route.keyboard,
      )
    },
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
      actionName: `${Tg.$ymbols.x0_QUOTE_DOUBLE_RIGHT} Дом`,
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
      actionName: `${HOME.actionName} ${Tg.$ymbols.x0_QUOTE_RIGHT} Места`,
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

      await context.reply(`Dobro došli, ${firstname} ${Tg.$ymbols.x3_HEART}`)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })

    telegraf.help(async (context) => {
      await context.reply(Tg.Constants.S_HELP)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })

    telegraf.command('feedback', async (context) => {
      await context.reply(Tg.Constants.S_FEEDBACK)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })
  }

  private static setupFallbacks(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Constants.R_ANY_ACTION, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await context.reply(Tg.Constants.S_HELP)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })

    telegraf.on('message', async (context) => {
      await context.reply(Tg.Constants.S_HELP)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })
  }

  private static setupHome(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Routes.HOME.actionCode, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })
  }

  private static setupPlaces(telegraf: Telegraf<TgContext>): void {
    //
    telegraf.action(Tg.Routes.HOME_PLACES_.actionCode, async (context) => {
      await context.answerCbQuery()
      await context.editMessageReplyMarkup(null)
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME_PLACES_)
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
            `${Tg.Markdown.bold(countryName)} ${Tg.$ymbols.x0_DOT} ${name}`, //
            keyboard,
          )
        }

        if (places.length === _limit) {
          await Tg.Helpers.replyRoute(context, Tg.Routes.HOME_PLACES(_offset + _limit))
        }

        if (places.length < _limit) {
          await Tg.Helpers.replyRoute(context, Tg.Routes.HOME_PLACES(Infinity))
        }
      }
    })
  }

  private static setupPlacesCreate(): Scenes.WizardScene<TgContext> {
    interface TgSceneState {
      my2cents: number
    }

    //

    const composer = new Composer<TgContext>()

    composer.action('next', async (ctx) => {
      const state = Tg.Helpers.getSceneState<TgSceneState>(ctx)
      state.my2cents = 42
      // ctx.scene.session.my2cents = Math.floor(10 * Math.random())
      // ctx.session.my2cents = -Math.floor(10 * Math.random())
      await ctx.reply('Step 2. Via inline button')
      return ctx.wizard.next()
    })

    composer.command('next', async (ctx) => {
      const state = Tg.Helpers.getSceneState<TgSceneState>(ctx)
      state.my2cents = 42
      // ctx.scene.session.my2cents = Math.floor(10 * Math.random()) + 10
      // ctx.session.my2cents = -Math.floor(10 * Math.random()) - 10
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
        const state = Tg.Helpers.getSceneState<TgSceneState>(ctx)
        const responseText = [
          'Step 3',
          `ctx.scene.state.my2cents is ${state.my2cents}`,
          // `ctx.session.my2cents is ${ctx.session.my2cents}`,
          // `ctx.scene.session.my2cents === ${ctx.scene.session.my2cents}`,
        ].join('\n')
        await ctx.reply(responseText)
        return await ctx.scene.leave()
      },
    )

    scene.leave(async (context) => {
      await Tg.Helpers.replyRoute(context, Tg.Routes.HOME)
    })

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
