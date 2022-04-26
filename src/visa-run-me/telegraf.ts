import { Context, Markup, Scenes, Telegraf } from 'telegraf'
import { uid } from 'uid'

import { session } from './session'
import { timestampFromDate } from './utils'
import { Person, ydb } from './ydb'

interface TelegrafSession extends Scenes.SceneSession {}

export interface TelegrafContext extends Context {
  scene: Scenes.SceneContextScene<TelegrafContext>
  session: TelegrafSession
}

// eslint-disable-next-line max-lines-per-function
export function telegrafSetup(tgBotToken: string, debug: boolean): Telegraf<TelegrafContext> {
  const telegraf = new Telegraf<TelegrafContext>(tgBotToken)

  telegraf.use(async (context, next) => {
    if (debug) console.log('TG : context', JSON.stringify(context))
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
  telegraf.use(session())
  telegraf.use(stage.middleware())
  telegraf.command('greeter', async (ctx) => ctx.scene.enter('greeter'))
  telegraf.command('echo', async (ctx) => ctx.scene.enter('echo'))
  telegraf.on('message', async (ctx) => ctx.reply('Try /echo or /greeter'))

  //
  //
  //

  telegraf.start(async (context) => {
    if (debug) console.log('TG : start')
    const { id: tgid, first_name, last_name, username } = context.message.from
    const tgfullname: string = first_name + (last_name ? ' ' + last_name : '')
    const tgusername: string = username ?? 'null'

    //

    const response1 = await ydb.execute<Pick<Person, 'id'>>(
      `select id from persons where tgid == '${tgid}'`,
    )
    const id: string | undefined = response1[0]?.[0]?.id
    if (debug) console.log('TG : start : response1', JSON.stringify(response1))

    //

    const timestamp: number = timestampFromDate()
    const response2 = await ydb.execute(
      id
        ? `replace into persons (id, tgid, tgfullname, tgusername, updated) values ('${id}', '${tgid}', '${tgfullname}', '${tgusername}', ${timestamp})`
        : `insert into persons (id, _feedbacksCount, _feedbacksSum, _tripsCount, tgid, tgfullname, tgusername, created, updated) values ('${uid()}', 0, 0, 0, '${tgid}', '${tgfullname}', '${tgusername}', ${timestamp}, ${timestamp})`,
    )
    if (debug) console.log('TG : start : response2', JSON.stringify(response2))

    //

    await context.reply(`Добро пожаловать, ${tgfullname}!`)
  })

  telegraf.command('feedback', async (context) => {
    // оставить отзыв или предложение
    if (debug) console.log('TG : feedback')
    await context.reply('Оставьте отзыв или предложение @denis_zhbankov.')
  })

  telegraf.help(async (context) => {
    // получить инструкцию
    if (debug) console.log('TG : help')
    await context.reply('Инструкция в разработке... ⏳')
  })

  telegraf.hears('text', async (context) => {
    if (debug) console.log('TG : text')

    const response: string = context.message.text
    await context.reply(
      response,
      Markup.keyboard(['/start', '/help', '/feedback']).oneTime().resize(),
    )
  })

  process.once('SIGINT', () => telegraf.stop('SIGINT'))
  process.once('SIGTERM', () => telegraf.stop('SIGTERM'))

  return telegraf
}
