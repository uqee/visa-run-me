export namespace YC {
  export namespace CF {
    export interface Context {
      awsRequestId: string
      functionName: string
      functionVersion: string
      getPayload: () => unknown
      logGroupName: string
      memoryLimitInMB: number
      requestId: string
    }

    export interface Request {
      body?: string
      headers?: { [id: string]: string }
      httpMethod: string
      isBase64Encoded?: boolean
      multiValueHeaders?: { [id: string]: string[] }
      multiValueQueryStringParameters?: { [id: string]: string[] }
      path?: string
      queryStringParameters?: { [id: string]: string }
      requestContext?: {
        identity: {
          sourceIp: string
          userAgent: string
        }
        httpMethod: string
        requestId: string
        requestTime: string
        requestTimeEpoch: number
      }
    }

    export interface Response {
      body: string
      headers?: { [id: string]: string }
      isBase64Encoded?: boolean
      statusCode: number
    }
  }
}
