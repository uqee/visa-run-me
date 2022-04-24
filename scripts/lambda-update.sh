#!/bin/sh

# echo "Env"
export $(grep -v '^#' ./.env)

# echo "Build"
rm -rf ./build
npx tsc --build tsconfig.json
cp package.json ./build/package.json

# echo "Deploy"
yc serverless function version create \
  --entrypoint index.handler \
  --environment TG_BOT_TOKEN=$TG_BOT_TOKEN,YC_DB_NAME=$YC_DB_NAME \
  --execution-timeout 3s \
  --folder-id $YC_FOLDER_ID \
  --function-name=$YC_CF_FUNCTION_NAME \
  --memory 128m \
  --runtime nodejs16 \
  --service-account-id=$YC_FOLDER_SERVICE_ACCOUNT_ID \
  --source-path ./build
