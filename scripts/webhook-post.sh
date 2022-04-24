#!/bin/sh

export $(grep -v '^#' ./.env)
curl \
  --data '{"drop_pending_updates":true,"url":"https://'$YC_APIGW_DOMAIN'/'$YC_CF_FUNCTION_NAME'"}' \
  --header 'content-type:application/json' \
  --request POST \
  --url https://api.telegram.org/bot$TG_BOT_TOKEN/setWebhook
