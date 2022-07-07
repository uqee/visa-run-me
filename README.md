# visa-run-me

## Manuals

    https://cloud.yandex.com/docs/functions/tutorials/telegram-bot-serverless
    https://cloud.yandex.com/en/docs/functions/tutorials/connect-to-ydb-nodejs
    https://cloud.yandex.com/en/docs/ydb/yql/reference/

## Links

    https://console.cloud.yandex.com/folders/b1gfj80j9tese114924g/ydb/databases/etnq140fubsghltg475i/browse
    https://console.cloud.yandex.com/folders/b1gfj80j9tese114924g/logging/group/e23r4lgmfue60kk97o7h/logs

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
