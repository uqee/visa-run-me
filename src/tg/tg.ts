import { Context, Markup, Scenes, Telegraf } from 'telegraf'

import { Person, ydb } from '../ydb'
import { session } from './session'

interface TgSession extends Scenes.SceneSession {}

export interface TgContext extends Context {
  scene: Scenes.SceneContextScene<TgContext>
  session: TgSession
}

class Tg {
  private debug: boolean | undefined
  private telegraf: Telegraf<TgContext> | undefined

  // eslint-disable-next-line max-lines-per-function
  public setup(tgBotToken: string, debug: boolean): Telegraf<TgContext> {
    this.debug = debug
    this.telegraf = new Telegraf<TgContext>(tgBotToken)

    this.telegraf.use(async (context, next) => {
      if (this.debug) console.log('TG : context', JSON.stringify(context))
      return next()
    })

    //
    //
    //

    const greeterScene = new Scenes.BaseScene<Scenes.SceneContext>('greeter')
    greeterScene.enter(async (ctx) => ctx.reply('greeter.enter'))
    greeterScene.leave(async (ctx) => ctx.reply('greeter.leave'))
    greeterScene.hears('bye', async (ctx) => ctx.scene.leave())
    greeterScene.on('message', async (ctx) => ctx.reply('greeter'))

    const echoScene = new Scenes.BaseScene<Scenes.SceneContext>('echo')
    echoScene.enter(async (ctx) => ctx.reply('echo.enter'))
    echoScene.leave(async (ctx) => ctx.reply('echo.leave'))
    echoScene.hears('bye', async (ctx) => ctx.scene.leave())
    echoScene.on('text', async (ctx) => ctx.reply(ctx.message.text))
    echoScene.on('message', async (ctx) => ctx.reply('Only text messages please'))

    const stage = new Scenes.Stage<Scenes.SceneContext>([greeterScene, echoScene])
    this.telegraf.use(session())
    this.telegraf.use(stage.middleware())
    this.telegraf.command('greeter', async (ctx) => ctx.scene.enter('greeter'))
    this.telegraf.command('echo', async (ctx) => ctx.scene.enter('echo'))
    this.telegraf.on('message', async (ctx) => ctx.reply('Try /echo or /greeter'))

    //
    //
    //

    this.telegraf.start(async (context) => {
      if (this.debug) console.log('TG : start')
      const { id, first_name: firstname, last_name: lastname, username } = context.message.from
      const userid: string = `${id}`

      const person: Person | undefined = await ydb.personsSelectByUserid({ userid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, username })
      else await ydb.personsInsert({ firstname, lastname, userid, username })

      await context.reply(`Добро пожаловать, ${firstname}!`)
    })

    this.telegraf.command('feedback', async (context) => {
      // оставить отзыв или предложение
      if (this.debug) console.log('TG : feedback')
      await context.reply('Оставьте отзыв или предложение @denis_zhbankov.')
    })

    this.telegraf.help(async (context) => {
      // получить инструкцию
      if (this.debug) console.log('TG : help')
      await context.reply('Инструкция в разработке... ⏳')
    })

    this.telegraf.hears('text', async (context) => {
      if (this.debug) console.log('TG : text')

      const response: string = context.message.text
      await context.reply(
        response,
        Markup.keyboard(['/start', '/help', '/feedback']).oneTime().resize(),
      )
    })

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    return this.telegraf
  }
}

export const tg: Tg = new Tg()
