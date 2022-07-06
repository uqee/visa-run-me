import { InlineKeyboardButton } from '@grammyjs/types'
import { Context, Markup } from 'telegraf'

import { epochToTimestamp } from '../utils'
import { Epoch, NeedDto, Person, Place, Tgid, TripDto } from '../ydb'
import { Chars, Strings } from './constants'

//

export interface TgActionButton {
  hidden?: boolean
  payload: string
  text: string
}

export interface TgActionResponse {
  keyboard: Array<Array<TgActionButton | undefined>>
  message: string
}

export interface TgAction<TArgs extends object | void = void> {
  button: (args: TArgs) => TgActionButton
  handler: {
    parser: (contextMatch: string[]) => TArgs
    pattern: RegExp
  }
}

//

export enum _Arrow {
  LEFT,
  RIGHT,
}

export interface _WithArrow {
  _arrow?: _Arrow
}

export interface _WithPlaceName {
  _placeName?: Place['name']
}

//

const Format = {
  bold: (s: string): string => `<b>${s}</b>`,
  // code: (s: string): string => `<code class="language-python">${s}</code>`,
  // italic: (s: string): string => `<i>${s}</i>`,
  link: (s: string, url: string): string => `<a href="${url}">${s}</a>`,
  // pre: (s: string): string => `<pre>${s}</pre>`,
  spoiler: (s: string): string => `<span class="tg-spoiler">${s}</span>`,
  // strikethrough: (s: string): string => `<s>${s}</s>`,
  // underline: (s: string): string => `<u>${s}</u>`,
} as const

const Helpers = {
  accept: async (context: Context): Promise<void> => {
    await context.answerCbQuery(undefined, { cache_time: 3 })
    await context.deleteMessage()
  },

  endOfDay: (timestamp: number): number => {
    const endOfDay = new Date(timestamp)
    endOfDay.setUTCHours(23, 59, 59, 0)
    return endOfDay.getTime()
  },

  epochToString: (epoch: Epoch): string => {
    const [m, d] = new Date(epochToTimestamp(epoch)).toISOString().substring(5, 10).split('-')
    return `${+d} ${Strings.MONTH_NAMES[m]}`
  },

  // escape: (message: string): string => {
  //   // https://core.telegram.org/bots/api#html-style
  //   return message
  //     .replace(/&/g, '&amp;') //
  //     .replace(/</g, '&lt;')
  //     .replace(/>/g, '&gt;')
  // },

  getTgid: (context: Context): Tgid | never => {
    const tgid: Tgid | undefined = context.from?.id
    if (tgid === undefined) throw new Error('tgid === undefined')
    return tgid
  },

  header: (header: string, sub?: string, subsub?: string): string => {
    let text: string = Format.bold(header)
    if (sub) text += ` ${Chars.x0_DOT} ${sub}`
    if (subsub) text += ` ${Chars.x0_DOT} ${subsub}`
    return text
  },

  keyboard2d: (args: { buttons: TgActionButton[]; columns: number }): TgActionButton[][] => {
    const { buttons, columns } = args
    const keyboard1d: TgActionButton[] = buttons.slice()
    const keyboard2d: TgActionButton[][] = []
    while (keyboard1d.length) keyboard2d.push(keyboard1d.splice(0, columns))
    return keyboard2d
  },

  needToString: (
    args: Partial<Pick<NeedDto, 'id'>> &
      Pick<NeedDto, 'maxday' | 'maxprice' | 'personTgname' | 'placeName' | 'tgid'>,
  ): string => {
    const { id, maxday, maxprice, personTgname, placeName, tgid } = args
    let message: string = ''

    message += `${Helpers.numberToString(id ?? '??')} ${Format.spoiler(
      Helpers.userLink(personTgname, tgid),
    )}\n`

    message += `${Chars.x0_DOT} из ${placeName}\n`
    message += `${Chars.x0_DOT} до ${Helpers.epochToString(maxday)}\n`
    message += `${Chars.x0_DOT} за ${Helpers.priceToString(maxprice)}\n`

    return message
  },

  numberToString: (number: number | string): string => {
    return `${Chars.x0_NUMBER} ${number}`
  },

  paginationText: (_arrow?: _Arrow): string => {
    if (_arrow === _Arrow.LEFT) return `${Chars.x0_ARROW_LEFT} Назад`
    if (_arrow === _Arrow.RIGHT) return `Вперед ${Chars.x0_ARROW_RIGHT}`
    return Chars.x0_ARROW_DOWN
  },

  priceToString: (price: number): string => {
    return `${price} ${Chars.x1_EURO}`
  },

  reply: async (context: Context, response: TgActionResponse): Promise<void> => {
    const { keyboard, message } = response
    await context.replyWithHTML(
      message,
      Markup.inlineKeyboard(Helpers.reply_getNativeKeyboard(keyboard)),
    )
  },

  reply_getNativeKeyboard: (
    keyboard: Array<Array<TgActionButton | undefined>>,
  ): InlineKeyboardButton.CallbackButton[][] => {
    return keyboard
      .filter((buttons) => !!buttons.length)
      .map((buttons) => {
        return buttons
          .filter((button: TgActionButton | undefined): button is TgActionButton => !!button)
          .map(({ hidden, payload, text }) => Markup.button.callback(text, payload, hidden))
      })
  },

  tripToString: (
    args: Partial<Pick<TripDto, 'id'>> &
      Pick<TripDto, 'capacity' | 'day' | 'personTgname' | 'tgid' | 'tripPlaces'>,
  ): string => {
    const { capacity, day, id, personTgname, tgid, tripPlaces } = args
    let message: string = ''

    message += `${Helpers.numberToString(id ?? '??')} ${Format.spoiler(
      Helpers.userLink(personTgname, tgid),
    )}\n`

    message += `${Chars.x0_DOT} выезд ${Helpers.epochToString(day)}\n`
    message += `${Chars.x0_DOT} пассажиров ${capacity}\n`
    for (const tripPlace of tripPlaces) {
      message += `${Chars.x0_DOT} `
      message += `из ${tripPlace.placeName} `
      message += `за ${Helpers.priceToString(tripPlace.minprice)}\n`
    }

    return message
  },

  userLink: (tgname: Person['tgname'], tgid: Tgid): string => {
    return Format.link(`@${tgname ?? tgid}`, `tg://user?id=${tgid}`)
  },
} as const

export { Format, Helpers }
