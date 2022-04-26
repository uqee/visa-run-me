export interface _Session {
  created: number
  key: string
  value: string
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
  capacity: number
  model: string
  personId: string
}

//

export interface Country extends Standard {
  name: string
}

//

export interface Feedback extends Standard {
  personId: string
  stars: number
  tripId: string
}

//

export enum NeedStatus {
  Todo = 0,
  Arranged = 1,
  Canceled = 2,
  Done = 3,
}

export interface Need extends Standard {
  departure: number
  personId: string
  placeId: string
  price: number
  status: NeedStatus
  tripId: string
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
  role: TripPersonRole
  tripId: string
}

//

export interface TripPlace extends Standard {
  agenda: string
  arrival: number
  duration: number
  placeId: string
  price: number
  tripId: string
}
