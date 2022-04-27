/* eslint-disable no-await-in-loop */

import { Update, User } from '@grammyjs/types'
import { Context, Markup, Scenes, Telegraf } from 'telegraf'

import { Person, Place, ydb } from '../ydb'
import { session } from './session'

interface TgSession extends Scenes.SceneSession {}

export interface TgContext extends Context {
  scene: Scenes.SceneContextScene<TgContext>
  session: TgSession
}

class Tg {
  private static readonly _ = {
    HOME: 'HOME',
    HOME_DRIVER: 'HOME_DRIVER',
    HOME_PASSENGER: 'HOME_PASSENGER',
    HOME_SHARED: 'HOME_SHARED',
    HOME_SHARED_PLACES: 'HOME_SHARED_PLACES',
    HOME_SHARED_PLACES_CREATE: 'HOME_SHARED_PLACES_CREATE',
    HOME_SHARED_PLACES_DELETE: 'HOME_SHARED_PLACES_DELETE',
    HOME_SHARED_PLACES_GET: 'HOME_SHARED_PLACES_GET',
  } as const

  private static readonly _Unicode = {
    CHECKMARK: '✓',
    DOWN: '↓',
    HEART: '♥',
    LEFT: '←',
    MINUS: '−',
    MULT: '×',
    PLUS: '+',
    RIGHT: '→',
    UP: '↑',
  } as const

  private static readonly Dict = {
    DELETE: `${Tg._Unicode.MULT} Удалить`,
    DELETED: `${Tg._Unicode.CHECKMARK} Удалено`,
    GET: `${Tg._Unicode.DOWN} Загрузить`,
    GET_MORE: `${Tg._Unicode.DOWN} Загрузить еще`,
    GET_NOMORE: `${Tg._Unicode.MULT} Больше нет`,
    [Tg._.HOME]: '→ Домой',
    [Tg._.HOME_DRIVER]: '→ Водителям',
    HOME_DRIVER_CARS: '→ Машины',
    // HOME_DRIVER_CARS_CREATE: '+ Добавить',
    // HOME_DRIVER_CARS_DELETE: '- Удалить',
    HOME_DRIVER_NEEDS: '→ Заявки',
    // HOME_DRIVER_NEEDS_WRITE: '',
    HOME_DRIVER_TRIPS: '→ Поездки',
    // HOME_DRIVER_TRIPS_CONFIRM: '',
    // HOME_DRIVER_TRIPS_CREATE: '',
    // HOME_DRIVER_TRIPS_FINISH: '',
    [Tg._.HOME_PASSENGER]: '→ Пассажирам',
    HOME_PASSENGER_NEEDS: '→ Заявки',
    // HOME_PASSENGER_NEEDS_CREATE: '',
    // HOME_PASSENGER_NEEDS_DELETE: '',
    HOME_PASSENGER_TRIPS: '→ Поездки',
    // HOME_PASSENGER_TRIPS_ACCEPT: '',
    // HOME_PASSENGER_TRIPS_FEEDBACK: '',
    // HOME_PASSENGER_TRIPS_WRITE: '',
    [Tg._.HOME_SHARED]: '→ Общее',
    [Tg._.HOME_SHARED_PLACES]: '→ Города',
    [Tg._.HOME_SHARED_PLACES_CREATE]: '+ Добавить',
    [Tg._.HOME_SHARED_PLACES_DELETE]: '⨉× Удалить',
    [Tg._.HOME_SHARED_PLACES_GET]: '↓ Загрузить',
    ON_MESSAGE: `Используйте кнопки на клавиатуре ${Tg._Unicode.DOWN}`,
  } as const

  private static readonly keyboard: typeof Markup.keyboard = (buttons: unknown[][]) => {
    return Markup.keyboard(buttons).resize().oneTime()
  }

  private static readonly Keyboards = {
    [Tg._.HOME]: Tg.keyboard([
      [Tg.Dict.HOME_DRIVER, Tg.Dict.HOME_PASSENGER],
      [Tg.Dict.HOME_SHARED],
    ]),
    [Tg._.HOME_DRIVER]: Tg.keyboard([[Tg.Dict.HOME]]),
    [Tg._.HOME_PASSENGER]: Tg.keyboard([[Tg.Dict.HOME]]),
    [Tg._.HOME_SHARED]: Tg.keyboard([[Tg.Dict.HOME_SHARED_PLACES], [Tg.Dict.HOME]]),
    [Tg._.HOME_SHARED_PLACES]: Tg.keyboard([
      [
        Tg.Dict.HOME_SHARED_PLACES_CREATE,
        // Tg.Dict.HOME_SHARED_PLACES_DELETE,
        Tg.Dict.HOME_SHARED_PLACES_GET,
      ],
      [Tg.Dict.HOME_SHARED],
    ]),
    [Tg._.HOME_SHARED_PLACES_GET]: Tg.keyboard([[Tg.Dict.HOME]]),
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private static createSceneDefault() {
    const scene = new Scenes.BaseScene<Scenes.SceneContext>(Tg._.HOME_PASSENGER)

    scene.enter(async (context) => {
      await context.reply(Tg.Dict.HOME_PASSENGER, Tg.Keyboards.HOME_PASSENGER)
    })

    scene.leave(async (context) => {
      await context.reply(Tg.Dict.HOME, Tg.Keyboards.HOME)
    })

    scene.hears(Tg.Dict.HOME, async (context) => {
      await context.scene.leave()
    })

    scene.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    return scene
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, max-lines-per-function
  private static createScenePlaces() {
    const scene = new Scenes.BaseScene<Scenes.SceneContext>(Tg._.HOME_SHARED_PLACES_GET)

    scene.enter(async (context) => {
      await context.reply(
        Tg.Dict.GET,
        Markup.inlineKeyboard([
          Markup.button.callback(Tg.Dict.GET, 'GET:0'), //
        ]),
      )
    })

    scene.action(/^GET:(\d+)$/, async (context) => {
      await context.editMessageReplyMarkup(null)

      const _limit: number = 5
      const _offset: number = +context.match[1]
      const user: User | undefined = context.from
      if (user) {
        const tgid: string = `${user.id}`
        const places: Place[] = await ydb.placesSelectByTgid({ _limit, _offset, tgid })
        if (places.length === 0) await context.reply(Tg.Dict.GET_NOMORE)
        else {
          for (const place of places) {
            await context.reply(
              JSON.stringify(place),
              Markup.inlineKeyboard([
                Markup.button.callback(Tg.Dict.DELETE, `DELETE:${place.id}`), //
              ]),
            )
          }

          if (places.length === _limit) {
            await context.reply(
              Tg.Dict.GET_MORE,
              Markup.inlineKeyboard([
                Markup.button.callback(Tg.Dict.GET_MORE, `GET:${_offset + _limit}`),
              ]),
            )
          }
        }
      }

      await context.answerCbQuery()
    })

    scene.action(/^DELETE:(\w+)$/, async (context) => {
      await context.editMessageReplyMarkup(null)

      const id: string = context.match[1]
      const user: User | undefined = context.from
      if (user) {
        await ydb.placesDelete({ id })
        await context.reply(Tg.Dict.DELETED)
      }

      await context.answerCbQuery()
    })

    scene.hears(Tg.Dict.HOME, async (context) => {
      await context.scene.leave()
    })

    scene.leave(async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME)
    })

    scene.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    return scene
  }

  private static setupCommands(telegraf: Telegraf<TgContext>): void {
    //

    telegraf.start(async (context) => {
      const tgid: string = `${context.from.id}`
      const { first_name: firstname, last_name: lastname, username: tgname } = context.message.from

      const person: Person | undefined = await ydb.personsSelectByTgid({ tgid })
      if (person) await ydb.personsUpdate({ firstname, id: person.id, lastname, tgname })
      else await ydb.personsInsert({ firstname, lastname, tgid, tgname })

      await context.reply(`Dobro došli, ${firstname} ${Tg._Unicode.HEART}`, Tg.Keyboards.HOME)
    })

    telegraf.help(async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    telegraf.command('feedback', async (context) => {
      await context.reply('Оставьте отзыв или предложение @denis_zhbankov.')
    })
  }

  private static setupRouting(telegraf: Telegraf<TgContext>): void {
    //

    telegraf.hears(Tg.Dict.HOME, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME)
    })

    telegraf.hears(Tg.Dict.HOME_DRIVER, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME_DRIVER)
    })

    telegraf.hears(Tg.Dict.HOME_PASSENGER, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME_PASSENGER)
    })

    telegraf.hears(Tg.Dict.HOME_SHARED, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME_SHARED)
    })

    telegraf.hears(Tg.Dict.HOME_SHARED_PLACES, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME_SHARED_PLACES)
    })

    telegraf.hears(Tg.Dict.HOME_SHARED_PLACES_GET, async (context) => {
      await context.reply(Tg._Unicode.CHECKMARK, Tg.Keyboards.HOME_SHARED_PLACES_GET)
      await context.scene.enter(Tg._.HOME_SHARED_PLACES_GET)
    })
  }

  private debug: boolean | undefined
  private telegraf: Telegraf<TgContext> | undefined

  public async _execute(update: Update): Promise<void> {
    if (this.debug) console.log('TG : update', JSON.stringify(update))
    await this.telegraf?.handleUpdate(update)
  }

  public _setup(tgBotToken: string, debug: boolean): void {
    const telegraf: Telegraf<TgContext> = new Telegraf<TgContext>(tgBotToken)

    const stage = new Scenes.Stage<Scenes.SceneContext>([
      Tg.createScenePlaces(), //
      Tg.createSceneDefault(),
    ])

    telegraf.use(async (context, next) => {
      if (debug) console.log('TG : context', JSON.stringify(context))
      return next()
    })

    telegraf.use(session())
    telegraf.use(stage.middleware())

    Tg.setupCommands(telegraf)
    Tg.setupRouting(telegraf)

    telegraf.on('message', async (context) => {
      await context.reply(Tg.Dict.ON_MESSAGE)
    })

    process.once('SIGINT', () => this.telegraf?.stop('SIGINT'))
    process.once('SIGTERM', () => this.telegraf?.stop('SIGTERM'))

    this.debug = debug
    this.telegraf = telegraf
  }
}

export const tg: Tg = new Tg()
