#!/bin/sh

echo "1. Env"
export $(grep -v '^#' ./.env)

echo "2. Create $YC_CF_FUNCTION_NAME"
yc serverless function delete --name=$YC_CF_FUNCTION_NAME
yc serverless function create --name=$YC_CF_FUNCTION_NAME
yc serverless function allow-unauthenticated-invoke $YC_CF_FUNCTION_NAME --folder-id $YC_FOLDER_ID
yc serverless function list-access-bindings $YC_CF_FUNCTION_NAME

export YC_CF_FUNCTION_ID=`yc serverless function get --name=$YC_CF_FUNCTION_NAME --format json --folder-id=$YC_FOLDER_ID | jq -r '.id'`
echo "3. ID of $YC_CF_FUNCTION_NAME is $YC_CF_FUNCTION_ID"
# echo "YC_CF_FUNCTION_ID=$YC_CF_FUNCTION_ID" > functionid.env
# pwd
# cat main.env functionid.env > .env
