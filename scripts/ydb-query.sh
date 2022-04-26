#!/bin/sh

export $(grep -v '^#' ./.env)
ydb \
  --database $YC_DB_NAME \
  --endpoint $YC_DB_ENDPOINT \
  table query execute \
  --file ./scripts/ydb-query.sql
