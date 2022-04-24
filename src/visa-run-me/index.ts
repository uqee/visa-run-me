// import type { Update } from '@grammyjs/types'
// import { Telegraf } from 'telegraf'
import { Driver, getLogger, Logger, MetadataAuthService, Session, Ydb } from 'ydb-sdk'

import type { YC } from '../yc.d'

// env

const { TG_BOT_TOKEN, YC_DB_ENTRYPOINT, YC_DB_LOGLEVEL, YC_DB_NAME } = process.env
if (!TG_BOT_TOKEN || !YC_DB_ENTRYPOINT || !YC_DB_LOGLEVEL || !YC_DB_NAME) {
  throw new Error('Invalid ENV')
}

// db

const dbDriver: Driver = new Driver(
  YC_DB_ENTRYPOINT,
  YC_DB_NAME,
  new MetadataAuthService(YC_DB_NAME),
)

const dbLogger: Logger = getLogger({
  level: YC_DB_LOGLEVEL,
})

async function dbDriverReady(): Promise<void> {
  const ready: boolean = await dbDriver.ready(3e3)
  if (!ready) {
    dbLogger.fatal('Driver has not become ready in 3 seconds!')
    process.exit(1)
  }
}

async function describeTable(
  session: Session,
  tableName: string,
  logger: Logger,
): Promise<unknown> {
  await dbDriverReady()

  logger.info(`Describing table: ${tableName}`)
  const describeTableResult: Ydb.Table.DescribeTableResult = await session.describeTable(tableName)

  const shit = {
    columns: [] as unknown[],
    info: `Describe table ${tableName}`,
  }
  for (const column of describeTableResult.columns) {
    shit.columns.push({
      name: column.name,
      type: column.type!.optionalType!.item!.typeId!,
    })
  }

  return shit
}

// tg

// const telegraf: Telegraf = new Telegraf(TG_BOT_TOKEN)

// telegraf.help(async (ctx) => {
//   await ctx.reply(`Hi, ${ctx.message.from.username || 'Anonymous'}!\nhelp`)
// })

// telegraf.on('text', async (ctx) => {
//   await ctx.reply(`Hi, ${ctx.message.from.username || 'Anonymous'}!\n${ctx.message.text}`)
// })

// telegraf.start(async (ctx) => {
//   await ctx.reply(`Hi, ${ctx.message.from.username || 'Anonymous'}!\nstart`)
// })

// handler

const response: YC.CF.Response = { body: '', statusCode: 200 }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_request: YC.CF.Request): Promise<YC.CF.Response> {
  // const message: Update = JSON.parse(request.body || '') as Update
  // await telegraf.handleUpdate(message)

  let shit: unknown
  await dbDriver.tableClient.withSession(async (session) => {
    shit = await describeTable(session, 'countries', dbLogger)
  })
  dbLogger.info(`Shit is ${JSON.stringify(shit)}`)

  return response
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, import/no-commonjs
module.exports.handler = handler
