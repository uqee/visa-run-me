import type { Update } from '@grammyjs/types'
import { Telegraf } from 'telegraf'

import { tg, TgContext } from './tg'
import { encodeBase64ToUtf8, YC } from './utils'
import { ydb } from './ydb'

const { DEBUG, TG_BOT_TOKEN, YC_DB_NAME } = process.env
if (!TG_BOT_TOKEN || !YC_DB_NAME) throw new Error('Invalid ENV')

const debug: boolean = DEBUG === 'true'
const response: YC.CF.Response = { body: '', statusCode: 200 }
const telegraf: Telegraf<TgContext> = tg.setup(TG_BOT_TOKEN, debug)

export async function handler(
  request: YC.CF.Request,
  context: YC.CF.Context,
): Promise<YC.CF.Response> {
  if (debug) {
    console.log('YC : request', JSON.stringify(request))
    console.log('YC : context', JSON.stringify(context))
  }

  // ydb

  ydb.setup(YC_DB_NAME!, context.token.access_token, debug)

  // tg

  const { body, isBase64Encoded } = request
  const message: unknown = JSON.parse(
    body ? (isBase64Encoded ? encodeBase64ToUtf8(body) : body) : '',
  )
  const update: Update = message as Update
  await telegraf.handleUpdate(update)

  //

  return response
}
