# visa-run-me

## 2022-04-24

    https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
    https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
    https://cloud.yandex.com/en/docs/ydb/yql/reference/

principles

    items are immutable to not track dependencies

wizards

    create:car
      enter:car.model
      ? enter:car.capacity

    delete:car
      choose:car ! created
      set:car.deleted


    create:need
      choose:need.place ? create:place
      enter:need.day
      enter:need.price

    delete:need
      choose:need ! created
      set:need.deleted


    create:feedback
      choose:trip ! created or accepted, done
      choose:tripPerson ! without feedback
      enter:feedback.stars


    create:place
      choose:place.country
      enter:place.name

    ? update:place
      choose:place ! created
      choose:place.status

    ? delete:place
        choose:place ! created


    create:trip
        ? enter:trip.name
        ? enter.trip.day
        ? enter:trip.capacityMin
        ? enter:trip.capacityMax
        <loop>
          choose:place
          enter:tripPlace.price
          ? enter:tripPlace.time
          ? enter:tripPlace.agenda

    ? update:trip
        choose:trip ! created
        choose:trip.status

    accept:trip
