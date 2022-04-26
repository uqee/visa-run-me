export interface _Session {
  key: string
  value: string
  created: number
}

//
//
//

interface Standard {
  id: string
  created: number
  updated: number
}

//

export interface Car extends Standard {
  personId: string

  capacity: number
  model: string
}

//

export interface Country extends Standard {
  name: string
}

//

export interface Feedback extends Standard {
  personId: string
  tripId: string

  stars: number
}

//

export enum NeedStatus {
  Todo = 0,
  Arranged = 1,
  Canceled = 2,
  Done = 3,
}

export interface Need extends Standard {
  personId: string
  placeId: string
  tripId: string

  departure: number
  price: number
  status: NeedStatus
}

//

export interface Person extends Standard {
  _feedbacksCount: number
  _feedbacksSum: number
  _tripsCount: number
  tgid: string
  tgfullname: string
  tgusername: string
}

//

export interface Place extends Standard {
  countryId: string

  name: string
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
  name: string
  status: TripStatus
}

//

export interface TripCar extends Standard {
  carId: string
  tripId: string
}

//

export enum TripPersonRole {
  Driver = 0,
  Passenger = 1,
}

export interface TripPerson extends Standard {
  personId: string
  tripId: string

  role: TripPersonRole
}

//

export interface TripPlace extends Standard {
  placeId: string
  tripId: string

  agenda: string
  arrival: number
  duration: number
  price: number
}
