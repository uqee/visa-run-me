# visa-run-me

## Manuals

    https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
    https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
    https://cloud.yandex.com/en/docs/ydb/yql/reference/

## Principles

    items are immutable to not track dependencies

## Use Cases

    needs

      need:create
        need.place:select
        need.maxday:set
        need.maxprice:set ?

      needs:get(:next)
        ! created, due
          need:delete
        ! created, overdue
          need.feedback:set/show

    trips

      trip:create
        day:set
        time:set
        capacity:set
        <loop>
          place:select
          minprice:set

      trips:get(:next)
        ! created, due
          trip:delete
        ! created, overdue
          -
        ! not-created, not-entered
          need-trip:enter
        ! not-created, entered
          need-trip:leave
