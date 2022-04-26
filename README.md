# visa-run-me

## Manuals

    https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
    https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
    https://cloud.yandex.com/en/docs/ydb/yql/reference/

## Principles

    items are immutable to not track dependencies

## Use Cases

    create:car
      enter:car.name
      ? enter:car.capacity

    delete:car
      choose:car ! created
      set:car.deleted


    create:need
      choose:need.place ? create:place
      enter:need.deadline
      ? enter:need.price

    delete:need
      choose:need ! created
      set:need.deleted


    create:place
      choose:place.country
      enter:place.name

    delete:place
      choose:place ! created
      set:place.deleted


    create:trip
      enter.trip.day
      ? enter:trip.name
      ? enter:trip.capacityMin
      ? enter:trip.capacityMax
      ? choose:trip.car ? create:car
      <loop>
        choose:trip.place ? create:place
        ? enter:trip.place.price
        ? enter:trip.place.time
        ? enter:trip.place.agenda
      set:trip.status=offered

    accept:trip
      choose:trip
      choose:need ! created ? create:need
      set:need.trip=trip

    confirm:trip
      choose:trip ! created
      set:trip.status=confirmed

    feedback:trip
      choose:trip ! created or accepted, trip.status=finished
      choose:trip.person ! without feedback
      enter:feedback.stars

    finish:trip
      choose:trip ! created
      set:trip.status=finished
