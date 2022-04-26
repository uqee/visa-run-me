type Epoch = number // timestamp, precision 1 second
type Id = string // uid, 11 chars

//
// non-standard
//

export interface _Cache {
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
  ownerId: Id
}

//

export interface Car extends Standard {
  capacity: number
  model: string
  personId: Id
}

//

export interface Country extends Standard {
  name: string
}

//

export interface Feedback extends Standard {
  personId: Id
  stars: number
  tripId: Id
}

//

export enum NeedStatus {
  Todo = 0,
  Arranged = 1,
  Canceled = 2,
  Done = 3,
}

export interface Need extends Standard {
  day: Epoch
  personId: Id
  placeId: Id
  price: number
  status: NeedStatus
  tripId: Id
}

//

export interface Person extends Standard {
  _feedbacksCount: number
  _feedbacksSum: number
  _tripsCount: number
  firstname: string
  lastname: string
  userid: string
  username: string
}

//

enum PlaceStatus {
  Active = 0,
  Inactive = 1,
}

export interface Place extends Standard {
  countryId: Id
  name: string
  status: PlaceStatus
}

//

export enum TripStatus {
  Todo = 0,
  Arranged = 1,
  Canceled = 2,
  Done = 3,
}

export interface Trip extends Standard {
  capacityMax: number
  capacityMin: number
  day: Epoch
  name: string
  status: TripStatus
}

//

export interface TripCar extends Standard {
  carId: Id
  tripId: Id
}

//

export enum TripPersonRole {
  Driver = 0,
  Passenger = 1,
}

export interface TripPerson extends Standard {
  personId: Id
  role: TripPersonRole
  tripId: Id
}

//

export interface TripPlace extends Standard {
  agenda: string
  placeId: Id
  price: number
  time: Epoch
  tripId: Id
}
