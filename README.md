# visa-run-me

2202-04-23

  USE CASES

    нужен визаран
      пассажир
      город
      дата

    организую визаран
      водитель
      маршрут
      машина?
        полюбому еду
          конкретная машина
        еду если наберется рейс
          могу взять разные машины

  DATABASE

    Countries
      Id:Ref
      Name:Name
      ChangeTimestamp:ChangeTimestamp

    Places
      Id:Ref
      CountryId:Ref
      Name:Name
      Position:LatLong?
      ChangeTimestamp:ChangeTimestamp

    Persons - private
      Id:Ref
      Email:Email
      Name:Name
      TelegramId:Text?
      Phone:Phone?
      Image:Image?
      ChangeTimestamp:ChangeTimestamp

    Cars - private
      Id:Ref
      PersonId:Ref
      Model:Name
      Capacity:Number?
      Image:Image?
      ChangeTimestamp:ChangeTimestamp

    Trips
      Id:Ref
      CapacityMin:Number
      CapacityMax:Number
      Status:Enum - Offered | Settled | Canceled | Finished
      ChangeTimestamp:ChangeTimestamp

    TripCars
      Id:Ref
      TripId:Ref
      CarId:Ref
      ChangeTimestamp:ChangeTimestamp

    TripPlaces
      Id:Ref
      TripId:Ref
      PlaceId:Ref
      DateTime:DateTime
      // DateTimeReturn:DateTime
      Price:Price - to return?
      Agenda:Text
      ChangeTimestamp:ChangeTimestamp

    TripPersons
      Id:Ref
      TripId:Ref
      PersonId:Ref
      Role:Enum - Driver | Passenger
      ChangeTimestamp:ChangeTimestamp

    Wishes
      Id:Ref
      PersonId:Ref
      PlaceId:Ref
      Date:Date
      TripId:Ref?
      ChangeTimestamp:ChangeTimestamp

    Feedback
      Id:Ref
      TripId:Ref
      // PersonId:Ref
      Stars:Number - 1..5
      Text:Text?
      ChangeTimestamp:ChangeTimestamp

2022-04-24

  https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
  https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
