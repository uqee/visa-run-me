import { InlineKeyboardButton } from '@grammyjs/types'
import { Context, Markup } from 'telegraf'

import { epochToTimestamp } from '../utils'
import { Epoch, NeedDto, Person, Place, Tgid, TripDto, TripPlaceDto } from '../ydb'

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

const Chars = {
  x0_ARROW_DOWN: '↓',
  x0_ARROW_LEFT: '←',
  x0_ARROW_RIGHT: '→',
  // x0_ARROW_UP: '↑',
  // x0_CHECK: '✓',
  // x0_CIRCLE: '◯',
  // x0_CROSS: '╳',
  x0_DOT: '⋅',
  // x0_EM_DASH: '—',
  // x0_EN_DASH: '–',
  // x0_MINUS: '−',
  // x0_MULT: '×',
  x0_NUMBER: '№',
  // x0_PLUS: '+',
  // x0_QUOTE_DOUBLE_LEFT: '«',
  // x0_QUOTE_DOUBLE_RIGHT: '»',
  // x0_QUOTE_LEFT: '‹',
  // x0_QUOTE_RIGHT: '›',
  x1_EURO: '€',
  // x1_INFINITY: '∞',
  // x2_ARROWHEAD: '➤',
  // x2_BULLET: '•',
  // x2_CHEVRON_LEFT: '❮',
  // x2_CHEVRON_RIGHT: '❯',
  // x2_MINUS: '➖',
  // x2_MULT: '✖',
  // x2_PLUS: '➕',
  // x2_QUOTE_CLOSE: '❜',
  // x2_QUOTE_DOUBLE_CLOSE: '❞',
  // x2_QUOTE_DOUBLE_OPEN: '❝',
  // x2_QUOTE_OPEN: '❛',
  // x2_STAR: '★',
  // x2_TRIANGLE_DOWN: '▼',
  // x2_TRIANGLE_LEFT: '◀',
  // x2_TRIANGLE_RIGHT: '▶',
  // x2_TRIANGLE_UP: '▲',
  // x3_CHECK: '✅',
  // x3_CROSS: '❌',
  // x3_EXCLAMATION: '❗',
  x3_HEART: '♥',
  // x3_HOURGLASS: '⏳',
  // x3_LIKE: '👍',
  // x3_QUESTION: '❓',
  // x3_WTF: '⁉',
} as const

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
    const date: Date = new Date(epochToTimestamp(epoch))
    const dayOfWeek: string = Strings.DAYS[date.getUTCDay()]
    const [month, day] = date.toISOString().substring(5, 10).split('-')
    return `${dayOfWeek}, ${+day} ${Strings.MONTHS[month]}`
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

    message += Format.bold(Helpers.numberToString(id ?? '??'))
    message += ` ${Format.spoiler(Helpers.userLink(personTgname, tgid))}`

    message += `\n${Chars.x0_DOT} до ${Helpers.epochToString(maxday)}`
    message += `\n${Chars.x0_DOT} из ${placeName} за ${Helpers.priceToString(maxprice)}`

    return message
  },

  numberToString: (number: number | string): string => {
    return `${Chars.x0_NUMBER} ${number}`
  },

  pageToString: (args: { _limit: number; _offset: number }): string => {
    const { _limit, _offset } = args
    const n: number = Math.round(_offset / _limit) + 1
    return `${Strings.PAGE} ${n}`
  },

  paginationToString: (_arrow?: _Arrow): string => {
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
    args1: Partial<Pick<TripDto, 'id'>> &
      Pick<TripDto, 'capacity' | 'day' | 'personTgname' | 'tgid'>,
    args2: Array<Pick<TripPlaceDto, 'minprice' | 'placeId' | 'placeName'>>,
  ): string => {
    const { capacity, day, id, personTgname, tgid } = args1
    let message: string = ''

    message += Format.bold(Helpers.numberToString(id ?? '??'))
    message += ` ${Format.spoiler(Helpers.userLink(personTgname, tgid))}`

    message += `\n${Chars.x0_DOT} поездка ${Helpers.epochToString(day)}`
    message += `\n${Chars.x0_DOT} пассажиров ${capacity}`
    for (const tripPlace of args2) {
      message += `\n${Chars.x0_DOT} из ${tripPlace.placeName}`
      message += ` за ${Helpers.priceToString(tripPlace.minprice)}`
    }

    return message
  },

  userLink: (tgname: Person['tgname'], tgid: Tgid): string => {
    return Format.link(`@${tgname ?? tgid}`, `tg://user?id=${tgid}`)
  },
} as const

const Numbers = {
  MAX_PLACES_PER_TRIP: 6,
  NEEDS_SELECT_LIMIT: 3,
  PLACES_SELECT_LIMIT: 32,
  TRIPS_SELECT_LIMIT: 3,
} as const

const Strings = {
  ADD: 'Добавить',
  ADDITION: 'Добавление',
  DAYS: {
    0: 'пн',
    1: 'вт',
    2: 'ср',
    3: 'чт',
    4: 'пт',
    5: 'сб',
    6: 'вс',
  } as Record<string, string>,
  EMPTY_PAGE: 'Пустая страница',
  LIST: 'Список',
  MONTHS: {
    '01': 'января',
    '02': 'февраля',
    '03': 'марта',
    '04': 'апреля',
    '05': 'мая',
    '06': 'июня',
    '07': 'июля',
    '08': 'августа',
    '09': 'сентября',
    10: 'октября',
    11: 'ноября',
    12: 'декабря',
  } as Record<string, string>,
  NEEDS: 'Заявки',
  PAGE: 'Страница',
  REMOVAL: 'Удаление',
  REMOVE: 'Удалить',
  SAVE: 'Сохранить',
  SUCCESSFUL: 'Успешно',
  TRIPS: 'Поездки',
} as const

export { Chars, Format, Helpers, Numbers, Strings }
