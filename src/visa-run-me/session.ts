/* eslint-disable import/no-internal-modules */
// almost exact copy of telegraf/src/session
// to replace the deprecated component

import { MaybePromise } from 'telegraf/typings/composer.d'
import { Context } from 'telegraf/typings/context.d'
import { MiddlewareFn } from 'telegraf/typings/middleware.d'

import { timestampFromDate } from './utils'
import { _Session, ydb } from './ydb'

export interface SessionStore<T> {
  get: (name: string) => MaybePromise<T | undefined>
  set: (name: string, value: T) => MaybePromise<void>
  delete: (name: string) => MaybePromise<void>
}

interface SessionOptions<S extends object> {
  getSessionKey?: (ctx: Context) => Promise<string | undefined>
  store?: SessionStore<S>
  ttl?: number
}

export interface SessionContext<S extends object> extends Context {
  session?: S
}

export function session<S extends object>(
  options?: SessionOptions<S>,
): MiddlewareFn<SessionContext<S>> {
  const getSessionKey = options?.getSessionKey ?? defaultGetSessionKey
  const store = options?.store ?? new YdbSessionStore(options?.ttl)
  // eslint-disable-next-line consistent-return
  return async (ctx, next) => {
    const key = await getSessionKey(ctx)
    if (key == null) {
      return await next()
    }
    ctx.session = await store.get(key)
    await next()
    if (ctx.session == null) {
      await store.delete(key)
    } else {
      await store.set(key, ctx.session)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function defaultGetSessionKey(ctx: Context): Promise<string | undefined> {
  const fromId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (fromId == null || chatId == null) {
    return undefined
  }
  return `${fromId}:${chatId}`
}

interface YdbSessionStoreValue<T> {
  expires: number
  session: T
}

export class YdbSessionStore<T> implements SessionStore<T> {
  public constructor(private readonly ttl = 36e5) {}

  // eslint-disable-next-line class-methods-use-this
  public async delete(key: string): Promise<void> {
    await ydb.execute(`delete from _sessions where key == '${key}'`)
  }

  // eslint-disable-next-line class-methods-use-this
  public async get(key: string): Promise<T | undefined> {
    const result = await ydb.execute<Pick<_Session, 'value'>>(
      `select value from _sessions where key == '${key}'`,
    )
    const valueString: string | undefined = result[0]?.[0]?.value
    const valueObject: YdbSessionStoreValue<T> | undefined =
      valueString === undefined ? valueString : (JSON.parse(valueString) as YdbSessionStoreValue<T>)

    if (valueObject === undefined) {
      return undefined
    } else if (valueObject.expires < Date.now()) {
      await this.delete(key)
      return undefined
    }
    return valueObject.session
  }

  // eslint-disable-next-line class-methods-use-this
  public async set(key: string, value: T): Promise<void> {
    const valueString: string = JSON.stringify({
      expires: Date.now() + this.ttl,
      session: value,
    })
    await ydb.execute(
      `replace into _sessions (key, value, created) values ('${key}', '${valueString}', ${timestampFromDate()})`,
    )
  }
}

export function isSessionContext<S extends object>(ctx: Context): ctx is SessionContext<S> {
  return 'session' in ctx
}
