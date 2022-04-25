import type { Update } from '@grammyjs/types'
import { Telegraf } from 'telegraf'
import { Ydb } from 'ydb-sdk-lite'

import type { YC } from './yc.d'

//
// env
//

const { TG_BOT_TOKEN, YC_DB_NAME } = process.env
if (!TG_BOT_TOKEN || !YC_DB_NAME) {
  throw new Error('Invalid ENV')
}

//
// db
//

let ydb: Ydb | undefined
let ydbAccessToken: string | undefined

function updateYdb(context: YC.CF.Context): Ydb {
  const accessToken: string = context.token.access_token
  if (accessToken !== ydbAccessToken) {
    ydbAccessToken = accessToken
    ydb = undefined
  }
  if (ydb === undefined) {
    ydb = new Ydb({
      dbName: YC_DB_NAME!,
      iamToken: ydbAccessToken,
    })
  }
  return ydb
}

//
// tg
//

const telegraf: Telegraf = new Telegraf(TG_BOT_TOKEN)

telegraf.start(async (matchedContext) => {
  // console.log('start', JSON.stringify(matchedContext))
  await matchedContext.reply(
    `Добро пожаловать, @${matchedContext.message.from.username || 'Anonymous'}!`,
  )
})

telegraf.help(async (matchedContext) => {
  // console.log('help', JSON.stringify(matchedContext))
  await matchedContext.reply('Вопросы и предложения пишите @denis_zhbankov.')
})

telegraf.on('text', async (matchedContext) => {
  // console.log('text', JSON.stringify(matchedContext))

  const query: string | undefined = matchedContext.message.text
  let answer: string | undefined

  if (ydb !== undefined && query !== undefined) {
    try {
      const result = await ydb.executeDataQuery(query)
      answer = JSON.stringify(result)
    } catch (error) {
      console.log(query, '\n', error)
    }
  }

  // console.log('answer', answer)
  await matchedContext.reply(answer || 'Unknown answer')
})

process.once('SIGINT', () => telegraf.stop('SIGINT'))
process.once('SIGTERM', () => telegraf.stop('SIGTERM'))

//
// utils
//

function fromBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf8')
}

// function toBase64(utf8: string): string {
//   return Buffer.from(utf8, 'utf-8').toString('base64')
// }

//
// handler
//

const response: YC.CF.Response = { body: '', statusCode: 200 }
async function handler(request: YC.CF.Request, context: YC.CF.Context): Promise<YC.CF.Response> {
  // console.log('request', JSON.stringify(request))
  // console.log('context', JSON.stringify(context))

  updateYdb(context)
  const { body, isBase64Encoded } = request
  const message: unknown = JSON.parse(body ? (isBase64Encoded ? fromBase64(body) : body) : '')
  const update: Update = message as Update
  await telegraf.handleUpdate(update)

  // console.log('response', JSON.stringify(response))
  return response
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, import/no-commonjs
module.exports.handler = handler
