import type { Update } from '@grammyjs/types'

import { tg } from './tg'
import { encodeBase64ToUtf8, YC } from './utils'
import { ydb } from './ydb'

const { DEBUG, TG_BOT_TOKEN, YC_DB_NAME } = process.env
if (!TG_BOT_TOKEN || !YC_DB_NAME) throw new Error('Invalid ENV')

const debug: boolean = DEBUG === 'true'
const response: YC.CF.Response = { body: '', statusCode: 200 }
tg._setup(TG_BOT_TOKEN, debug)

export async function handler(
  request: YC.CF.Request,
  context: YC.CF.Context,
): Promise<YC.CF.Response> {
  if (debug) console.log('YC', JSON.stringify(request), JSON.stringify(context))
  ydb._setup(YC_DB_NAME!, context.token.access_token, debug)

  const { body, isBase64Encoded } = request
  if (body) {
    const message: string = isBase64Encoded ? encodeBase64ToUtf8(body) : body
    await tg._execute(JSON.parse(message) as Update)
  }

  return response
}
