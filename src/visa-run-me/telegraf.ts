import { Telegraf } from 'telegraf'
import { uid } from 'uid'

import { timestampFromDate } from './timestamp'
import { ydbExecute } from './ydb'

export function telegrafSetup(tgBotToken: string, debug: boolean): Telegraf {
  const telegraf: Telegraf = new Telegraf(tgBotToken)

  telegraf.start(async (matchedContext) => {
    if (debug) console.log('start', JSON.stringify(matchedContext))
    const { id: tgid, first_name, last_name, username } = matchedContext.message.from
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

    await matchedContext.reply(`Добро пожаловать, ${tgfullname}!`)
  })

  telegraf.command('feedback', async (matchedContext) => {
    // оставить отзыв или предложение
    if (debug) console.log('feedback', JSON.stringify(matchedContext))
    await matchedContext.reply('Оставьте отзыв или предложение @denis_zhbankov.')
  })

  telegraf.help(async (matchedContext) => {
    // получить инструкцию
    if (debug) console.log('help', JSON.stringify(matchedContext))
    await matchedContext.reply('Инструкция в разработке... ⏳')
  })

  telegraf.on('text', async (matchedContext) => {
    if (debug) console.log('text', JSON.stringify(matchedContext))

    const request: string = matchedContext.message.text
    const response: string = JSON.stringify(await ydbExecute(request))

    if (debug) console.log('response', response)
    await matchedContext.reply(response)
  })

  process.once('SIGINT', () => telegraf.stop('SIGINT'))
  process.once('SIGTERM', () => telegraf.stop('SIGTERM'))

  return telegraf
}
