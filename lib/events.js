export const eventV2 = {
  version: "2.0",
  routeKey: "GET /",
  rawPath: "/",
  rawQueryString: "",
  cookies: [],
  headers: {
    "content-type": "application/json",
    host: "localhost",
    "user-agent": "tinybench",
  },
  requestContext: {
    accountId: "000000000000",
    apiId: "api",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "GET",
      path: "/",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "tinybench",
    },
    requestId: "0",
    routeKey: "GET /",
    stage: "$default",
    time: "2026-05-16T00:00:00.000Z",
    timeEpoch: 1747353600000,
  },
  body: undefined,
  isBase64Encoded: false,
};

export const eventV2Post = {
  version: "2.0",
  routeKey: "POST /",
  rawPath: "/",
  rawQueryString: "",
  cookies: [],
  headers: {
    "content-type": "application/json",
    host: "localhost",
    "user-agent": "tinybench",
  },
  requestContext: {
    accountId: "000000000000",
    apiId: "api",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "POST",
      path: "/",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "tinybench",
    },
    requestId: "0",
    routeKey: "POST /",
    stage: "$default",
    time: "2026-05-16T00:00:00.000Z",
    timeEpoch: 1747353600000,
  },
  body: JSON.stringify({ name: "Alice", age: 30 }),
  isBase64Encoded: false,
};

export const eventV1 = {
  resource: "/",
  path: "/",
  httpMethod: "GET",
  headers: {
    "content-type": "application/json",
    Host: "localhost",
    "User-Agent": "tinybench",
  },
  multiValueHeaders: {
    "content-type": ["application/json"],
    Host: ["localhost"],
    "User-Agent": ["tinybench"],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "000000000000",
    apiId: "api",
    httpMethod: "GET",
    path: "/",
    protocol: "HTTP/1.1",
    resourceId: "root",
    resourcePath: "/",
    stage: "prod",
    requestId: "0",
    requestTime: "16/May/2026:00:00:00 +0000",
    requestTimeEpoch: 1747353600000,
    identity: {
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "tinybench",
      userArn: null,
    },
  },
  body: null,
  isBase64Encoded: false,
};

export const eventSQS = {
  Records: [
    {
      messageId: "00000000-0000-0000-0000-000000000000",
      receiptHandle: "MessageReceiptHandle",
      // base64-encoded JSON `{"hello":"world"}` — required by @middy/event-batch-parser
      // even for aws:sqs (parser unconditionally base64-decodes every record body).
      body: Buffer.from(JSON.stringify({ hello: "world" })).toString("base64"),
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1747353600000",
        SenderId: "ABCDEFG1234567",
        ApproximateFirstReceiveTimestamp: "1747353600000",
      },
      messageAttributes: {},
      md5OfBody: "fbc24bcc7a1794758fc1327fcfebdaf6",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:us-east-1:000000000000:queue",
      awsRegion: "us-east-1",
    },
  ],
};

export const eventSNS = {
  Records: [
    {
      EventSource: "aws:sns",
      EventVersion: "1.0",
      EventSubscriptionArn:
        "arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000",
      Sns: {
        Type: "Notification",
        MessageId: "00000000-0000-0000-0000-000000000000",
        TopicArn: "arn:aws:sns:us-east-1:000000000000:topic",
        Subject: "bench",
        Message: JSON.stringify({ hello: "world" }),
        Timestamp: "2026-05-16T00:00:00.000Z",
        SignatureVersion: "1",
        Signature: "sig",
        SigningCertUrl:
          "https://sns.us-east-1.amazonaws.com/SimpleNotificationService.pem",
        UnsubscribeUrl: "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe",
        MessageAttributes: {},
      },
    },
  ],
};
