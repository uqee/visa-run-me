#!/bin/sh

export $(grep -v '^#' ./.env)
curl https://api.telegram.org/bot$TG_BOT_TOKEN/getWebhookInfo
