#!/bin/sh

export $(grep -v '^#' ./.env)
curl \
  --data '{"drop_pending_updates":true}' \
  --request POST \
  --url https://api.telegram.org/bot$TG_BOT_TOKEN/deleteWebhook
