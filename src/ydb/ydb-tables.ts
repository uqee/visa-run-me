type Epoch = number // timestamp, precision 1 second
type Id = string // uid, 11 chars
export type Tgid = string

interface Table {
  created: Epoch
  deleted: Epoch
  id: Id
  tgid: Tgid
}

//

export interface Cache {
  created: Epoch
  key: string
  value: string
}

export interface Need extends Table {
  maxday: Epoch
  maxprice: number
  personId: Id
  placeId: Id
}

export interface Person extends Table {
  firstname: string
  lastname?: string
  // tgid: Tgid
  tgname?: string
}

export interface Place extends Table {
  name: string
}

export interface Trip extends Table {
  capacity: number
  day: Epoch
  personId: Id
}

export interface TripPlace extends Table {
  minprice: number
  placeId: Id
  tripId: Id
}
