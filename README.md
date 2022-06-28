# visa-run-me

## Manuals

    https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
    https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
    https://cloud.yandex.com/en/docs/ydb/yql/reference/

## Principles

    items are immutable to not track dependencies

## Use Cases

    needs

      list(offset)

      create
        place:select
        maxday:set
        maxprice:set

      delete
        :select

    trips

      list(offset)

      create
        day:set
        time:set
        capacity:set
        <loop>
          place:select
          minprice:set

      delete
        :select
