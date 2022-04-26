import { Context, Markup, Scenes, Telegraf } from 'telegraf'

import { Person, ydb } from '../ydb'
import { session } from './session'

interface TgSession extends Scenes.SceneSession {}

export interface TgContext extends Context {
  scene: Scenes.SceneContextScene<TgContext>
  session: TgSession
}

class Tg {
  private static readonly Dict = {
    ON_MESSAGE: 'Пожалуйста, воспользуйтесь кнопками меню ↓',
    ROOT: 'Домой',
    ROOT_DRIVER: 'Водителям',
    ROOT_PASSENGER: 'Пассажирам',
  }

  private static readonly Keyboards = {
    ROOT: Markup.keyboard([[Tg.Dict.ROOT_DRIVER, Tg.Dict.ROOT_PASSENGER]]),
    ROOT_DRIVER: Markup.keyboard([[Tg.Dict.ROOT]]),
    ROOT_PASSENGER: Markup.keyboard([[Tg.Dict.ROOT]]),
  }

  private static readonly Routes = {
    ROOT: 'ROOT',
    ROOT_DRIVER: 'ROOT_DRIVER',
    ROOT_PASSENGER: 'ROOT_PASSENGER',
  }

  private static to(route: string): string {
    return `→ ${route}`
  }

  private debug: boolean | undefined
  private telegraf: Telegraf<TgContext> | undefined

  // eslint-disable-next-line max-lines-per-function
  public setup(tgBotToken: string, debug: boolean): Telegraf<TgContext> {
    const telegraf: Telegraf<TgContext> = new Telegraf<TgContext>(tgBotToken)

    //
    // driver
    //

    const baseSceneDriver = new Scenes.BaseScene<Scenes.SceneContext>(Tg.Routes.ROOT_DRIVER)

    baseSceneDriver.enter(async (context) => {
      await context.reply(Tg.to(Tg.Dict.ROOT_DRIVER), Tg.Keyboards.ROOT_DRIVER)
    })

    baseSceneDriver.leave(async (context) => {
      await context.reply(Tg.to(Tg.Dict.ROOT), Tg.Keyboards.ROOT)
    })

    baseSceneDriver.hears(Tg.Dict.ROOT, async (context) => {
      await context.scene.leave()
    })

    baseSceneDriver.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    //
    // passenger
    //

    const baseScenePassenger = new Scenes.BaseScene<Scenes.SceneContext>(Tg.Routes.ROOT_PASSENGER)

    baseScenePassenger.enter(async (context) => {
      await context.reply(Tg.to(Tg.Dict.ROOT_PASSENGER), Tg.Keyboards.ROOT_PASSENGER)
    })

    baseScenePassenger.leave(async (context) => {
      await context.reply(Tg.to(Tg.Dict.ROOT), Tg.Keyboards.ROOT)
    })

    baseScenePassenger.hears(Tg.Dict.ROOT, async (context) => {
      await context.scene.leave()
    })

    baseScenePassenger.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    //
    // root
    //

    const stage = new Scenes.Stage<Scenes.SceneContext>([
      baseSceneDriver, //
      baseScenePassenger,
    ])

    telegraf.use(async (context, next) => {
      if (debug) console.log('TG : context', JSON.stringify(context))
      return next()
    })

    telegraf.use(session())
    telegraf.use(stage.middleware())

    telegraf.start(async (context) => {
      const { id, first_name: firstname, last_name: lastname, username } = context.message.from
      const userid: string = `${id}`

      const person: Person | undefined = await ydb.personsSelectByUserid({ userid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, username })
      else await ydb.personsInsert({ firstname, lastname, userid, username })

      await context.reply(`Dobro došli, ${firstname} ♥`, Tg.Keyboards.ROOT)
    })

    telegraf.help(async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    telegraf.command('feedback', async (context) => {
      await context.reply('Оставьте отзыв или предложение @denis_zhbankov.')
    })

    telegraf.hears(Tg.Dict.ROOT_DRIVER, async (context) => {
      await context.scene.enter(Tg.Routes.ROOT_DRIVER)
    })

    telegraf.hears(Tg.Dict.ROOT_PASSENGER, async (context) => {
      await context.scene.enter(Tg.Routes.ROOT_PASSENGER)
    })

    telegraf.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    //
    //
    //

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    this.debug = debug
    this.telegraf = telegraf

    return telegraf
  }
}

export const tg: Tg = new Tg()
