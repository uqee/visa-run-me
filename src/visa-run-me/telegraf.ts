import { Context, Markup, Scenes, Telegraf } from 'telegraf'
import { uid } from 'uid'

import { session } from './session'
import { timestampFromDate } from './timestamp'
import { ydbExecute } from './ydb'

interface TelegrafSession extends Scenes.SceneSession {}

export interface TelegrafContext extends Context {
  scene: Scenes.SceneContextScene<TelegrafContext>
  session: TelegrafSession
}

export function telegrafSetup(tgBotToken: string, debug: boolean): Telegraf<TelegrafContext> {
  const telegraf = new Telegraf<TelegrafContext>(tgBotToken)

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
    if (debug) console.log('start', JSON.stringify(context))
    const { id: tgid, first_name, last_name, username } = context.message.from
    const tgfullname: string = first_name + (last_name ? ' ' + last_name : '')
    const tgusername: string = username ?? 'null'

    //

    const response1 = await ydbExecute(`select id from persons where tgid == '${tgid}'`)
    const id: string | undefined = response1[0]?.[0]?.id as string | undefined
    if (debug) console.log('response1', JSON.stringify(response1))

    //

    const timestamp: number = timestampFromDate()
    const response2 = await ydbExecute(
      id
        ? `replace into persons (id, tgid, tgfullname, tgusername, updated) values ('${id}', '${tgid}', '${tgfullname}', '${tgusername}', ${timestamp})`
        : `insert into persons (id, _feedbacksCount, _feedbacksSum, _tripsCount, tgid, tgfullname, tgusername, created, updated) values ('${uid()}', 0, 0, 0, '${tgid}', '${tgfullname}', '${tgusername}', ${timestamp}, ${timestamp})`,
    )
    if (debug) console.log('response2', JSON.stringify(response2))

    //

    await context.reply(`Добро пожаловать, ${tgfullname}!`)
  })

  telegraf.command('feedback', async (context) => {
    // оставить отзыв или предложение
    if (debug) console.log('feedback', JSON.stringify(context))
    await context.reply('Оставьте отзыв или предложение @denis_zhbankov.')
  })

  telegraf.help(async (context) => {
    // получить инструкцию
    if (debug) console.log('help', JSON.stringify(context))
    await context.reply('Инструкция в разработке... ⏳')
  })

  telegraf.hears('text', async (context) => {
    if (debug) console.log('text', JSON.stringify(context))

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
