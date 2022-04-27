type Epoch = number // timestamp, precision 1 second
type Id = string // uid, 11 chars
type Tgid = string

//
// non-standard
//

export interface Cache {
  created: Epoch
  key: string
  value: string
}

//
// standard
//

interface Standard {
  created: Epoch
  deleted: Epoch
  id: Id
  tgid: Tgid
}

//

export interface Car extends Standard {
  _feedbacksCount: number
  _feedbacksSum: number
  capacity?: number
  name: string
  personId: Id
}

//

export interface Country extends Standard {
  name: string
}

//

export interface Feedback extends Standard {
  personId: Id // from
  stars: number
  tripId: Id // to
}

//

export interface Need extends Standard {
  deadline: Epoch
  personId: Id
  placeId: Id
  price?: number
  tripId: Id
}

//

export interface Person extends Standard {
  _feedbacksCount: number
  _feedbacksSum: number
  firstname: string
  lastname?: string
  // tgid: Tgid
  tgname?: string
}

//

export interface Place extends Standard {
  countryId: Id
  name: string
}

//

export enum TripStatus {
  Offered = 0,
  Confirmed = 1,
  Finished = 2,
}

export interface Trip extends Standard {
  capacityMax?: number
  capacityMin?: number
  carId?: Id
  day: Epoch
  name?: string
  personId: Id
  status: TripStatus
}

//

export interface TripPlace extends Standard {
  agenda?: string
  placeId: Id
  price?: number
  time?: Epoch
  tripId: Id
}
