# Graphql Lambda Subscriptions

[![Release](https://github.com/reconbot/graphql-lambda-subscriptions/actions/workflows/test.yml/badge.svg)](https://github.com/reconbot/graphql-lambda-subscriptions/actions/workflows/test.yml)

Amazon Lambda Powered GraphQL Subscriptions. This is an Amazon Lambda Serverless equivalent to [`graphql-ws`](https://github.com/enisdenjo/graphql-ws). It follows the [`graphql-ws prototcol`](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md). It is tested with the [Architect Sandbox](https://arc.codes/docs/en/reference/cli/sandbox) against `graphql-ws` directly and run in production today. For many applications `graphql-lambda-subscriptions` should do what `graphql-ws` does for you today without having to run a server. This started as fork of `subscriptionless` another library with similar goals.

As `subscriptionless`'s tagline goes;

> Have all the functionality of GraphQL subscriptions on a stateful server without the cost.

## Why a fork?

I had different requirements and needed more features. This project wouldn't exist without [`subscriptionless`](https://github.com/andyrichardson/subscriptionless) and you should totally check it out.

## Features

- Only needs DynamoDB, API Gateway and Lambda (no [app sync](https://www.serverless.com/aws-appsync#benefits) or other managed graphql platform required, can use step functions for ping/pong support)
- Provides a Pub/Sub system to broadcast events to subscriptions
- Provides hooks for the full lifecycle of a subscription
- Type compatible with GraphQL and [`nexus.js`](https://nexusjs.org)
- Optional Logging

## Quick Start

Since there are many ways to deploy to amazon lambda I'm going to have to get opinionated in the quick start and pick [Architect](https://arc.codes). `graphql-lambda-subscriptions` should work on Lambda regardless of your deployment and packaging framework. Take a look at the [arc-basic-events](mocks/arc-basic-events) mock used for integration testing for an example of using it with Architect.

## API Docs

Can be found in our [docs folder](docs/README.md). You'll want to start with [`makeServer()`](docs/README.md#makeserver) and [`subscribe()`](dosc/README.md#subscribe).

## Setup

### Create a graphql-lambda-subscriptions server

```ts
import { makeServer } from 'graphql-lambda-subscriptions'

// define a schema and create a configured DynamoDB instance from aws-sdk
// and make a schema with resolvers (maybe look at) '@graphql-tools/schema

const subscriptionServer = makeServer({
  dynamodb,
  schema,
})
```

### Export the handler

```ts
export const handler = subscriptionServer.webSocketHandler;
```

### Configure API Gateway

Set up API Gateway to route WebSocket events to the exported handler.


<details>
<summary>📖  Architect Example</summary>

```arc
@app
basic-events

@ws
```

</details>

<details>
<summary>📖  Serverless Framework Example</summary>

```yaml
functions:
  websocket:
    name: my-subscription-lambda
    handler: ./handler.handler
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
      - websocket:
          route: $default
```

</details>

### Create DynanmoDB tables for state

In-flight connections and subscriptions need to be persisted.


#### Changing DynamoDB table names

Use the `tableNames` argument to override the default table names.

```ts
const instance = makeServer({
  /* ... */
  tableNames: {
    connections: 'my_connections',
    subscriptions: 'my_subscriptions',
  },
})

// or use an async function to retrieve the names

const fetchTableNames = async () => {
  // do some work to get your table names
  return {
    connections,
    subscriptions,
  }
}
const instance = makeServer({
  /* ... */
  tableNames: fetchTableNames(),
})

```

<details>

<summary>💾 Architect Example</summary>

```arc
@tables
Connection
  id *String
  ttl TTL
Subscription
  id *String
  topic **String
  ttl TTL

@indexes

Subscription
  connectionId *String
  name ConnectionIndex

Subscription
  topic *String
  name TopicIndex
```

```ts
import { tables } from '@architect/functions'

const fetchTableNames = async () => {
  const tables = await tables()

  const ensureName = (table) => {
    const actualTableName = tables.name(table)
    if (!actualTableName) {
      throw new Error(`No table found for ${table}`)
    }
    return actualTableName
  }

  return {
    connections: ensureName('Connection'),
    subscriptions: ensureName('Subscription'),
  }
}

const subscriptionServer = makeServer({
  dynamodb: tables.db,
  schema,
  tableNames: fetchTableNames(),
})
```

</details>

<details>
<summary>💾 Serverless Framework Example</summary>

```yaml
resources:
  Resources:
    # Table for tracking connections
    connectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.CONNECTIONS_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
    # Table for tracking subscriptions
    subscriptionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.SUBSCRIPTIONS_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: topic
            AttributeType: S
          - AttributeName: connectionId
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
          - AttributeName: topic
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: ConnectionIndex
            KeySchema:
              - AttributeName: connectionId
                KeyType: HASH
            Projection:
              ProjectionType: ALL
            ProvisionedThroughput:
              ReadCapacityUnits: 1
              WriteCapacityUnits: 1
          - IndexName: TopicIndex
            KeySchema:
              - AttributeName: topic
                KeyType: HASH
            Projection:
              ProjectionType: ALL
            ProvisionedThroughput:
              ReadCapacityUnits: 1
              WriteCapacityUnits: 1
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
```
</details>

<details>
<summary>💾 terraform example</summary>

```tf
resource "aws_dynamodb_table" "connections-table" {
  name           = "graphql_connections"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "subscriptions-table" {
  name           = "graphql_subscriptions"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key = "id"
  range_key = "topic"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "topic"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

  global_secondary_index {
    name               = "ConnectionIndex"
    hash_key           = "connectionId"
    write_capacity     = 1
    read_capacity      = 1
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "TopicIndex"
    hash_key           = "topic"
    write_capacity     = 1
    read_capacity      = 1
    projection_type    = "ALL"
  }
}
```

</details>

### PubSub

`graphql-lambda-subscriptions` uses it's own _PubSub_ implementation.

#### Subscribing to Topics

Use the [`subscribe`](docs/README.md#subscribe) function to associate incoming subscriptions with a topic.

```ts
import { subscribe } from 'graphql-lambda-subscriptions';

export const resolver = {
  Subscribe: {
    mySubscription: {
      subscribe: subscribe('MY_TOPIC'),
      resolve: (event, args, context) => {/* ... */}
    }
  }
}
```

<details>

<summary>📖 Filtering events</summary>

Use the [`subscribe`](docs/README.md#subscribe) with [`SubscribeOptions`](docs/interfaces/SubscribeOptions.md) to allow for filtering.

> Note: If a function is provided, it will be called **on subscription start** and must return a serializable object.

```ts
import { subscribe } from 'graphql-lambda-subscriptions';

// Subscription agnostic filter
subscribe('MY_TOPIC', {
  filter: {
    attr1: '`attr1` must have this value',
    attr2: {
      attr3: 'Nested attributes work fine',
    },
  }
})

// Subscription specific filter
subscribe('MY_TOPIC',{
  filter: (root, args, context, info) => ({
    userId: args.userId,
  }),
})
```

</details>

#### Publishing events

Use the `publish` on your graphql-lambda-subscriptions server to publish events to active subscriptions. Payloads must be of type `Record<string, any>` so they can be filtered and stored.

```tsx
subscriptionServer.publish({
  type: 'MY_TOPIC',
  payload: {
    message: 'Hey!',
  },
})
```

Events can come from many sources

```tsx
// SNS Event
export const snsHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      subscriptionServer.publish({
        topic: r.Sns.TopicArn.substring(r.Sns.TopicArn.lastIndexOf(':') + 1), // Get topic name (e.g. "MY_TOPIC")
        payload: JSON.parse(r.Sns.Message),
      })
    )
  );

// Manual Invocation
export const invocationHandler = (payload) => subscriptionServer.publish({ topic: 'MY_TOPIC', payload });
```

#### Completing Subscriptions

Use the `complete` on your graphql-lambda-subscriptions server to complete active subscriptions. Payloads are optional and match against filters like events do.

```tsx
subscriptionServer.complete({
  type: 'MY_TOPIC',
  // optional payload
  payload: {
    message: 'Hey!',
  },
})
```

### Context

Context values are accessible in all callback and resolver functions (`resolve`, `filter`, `onAfterSubscribe`, `onSubscribe` and `onComplete`).

<details>

<summary>📖 Default value</summary>

Assuming no `context` argument is provided, the default value is an object containing a `connectionInitPayload` attribute.

This attribute contains the [(optionally parsed)](#events) payload from `connection_init`.

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {
        console.log(context.connectionInitPayload); // payload from connection_init
      },
    },
  },
};
```

</details>

<details>

<summary>📖 Setting static context value</summary>

An object can be provided via the `context` attribute when calling `makeServer`.

```ts
const instance = makeServer({
  /* ... */
  context: {
    myAttr: 'hello',
  },
});
```

The default values (above) will be appended to this object prior to execution.

</details>

<details>

<summary>📖 Setting dynamic context value</summary>

A function (optionally async) can be provided via the `context` attribute when calling `makeServer`.

The default context value is passed as an argument.

```ts
const instance = makeServer({
  /* ... */
  context: ({ connectionInitPayload }) => ({
    myAttr: 'hello',
    user: connectionInitPayload.user,
  }),
});
```

</details>

### Side effects

Side effect handlers can be declared on subscription fields to handle `onSubscribe` (start) and `onComplete` (stop) events.

<details>

<summary>📖 Adding side-effect handlers</summary>

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {
        /* ... */
      },
      subscribe: subscribe('MY_TOPIC', {
        // filter?: object | ((...args: SubscribeArgs) => object)
        // onSubscribe?: (...args: SubscribeArgs) => void | Promise<void>
        // onComplete?: (...args: SubscribeArgs) => void | Promise<void>
        // onAfterSubscribe?: (...args: SubscribeArgs) => PubSubEvent | Promise<PubSubEvent> | undefined | Promise<undefined>
      }),
    },
  },
};
```

</details>

### Events

Global events can be provided when calling `makeServer` to track the execution cycle of the lambda.

<details>

<summary>📖 Connect (onConnect)</summary>

Called when a WebSocket connection is first established.

```ts
const instance = makeServer({
  /* ... */
  onConnect: ({ event }) => {
    /* */
  },
});
```

</details>

<details>

<summary>📖 Disconnect (onDisconnect)</summary>

Called when a WebSocket connection is disconnected.

```ts
const instance = makeServer({
  /* ... */
  onDisconnect: ({ event }) => {
    /* */
  },
});
```

</details>

<details>

<summary>📖 Authorization (connection_init)</summary>

`onConnectionInit` can be used to verify the `connection_init` payload prior to persistence.

> **Note:** Any sensitive data in the incoming message should be removed at this stage.

```ts
const instance = makeServer({
  /* ... */
  onConnectionInit: ({ message }) => {
    const token = message.payload.token;

    if (!myValidation(token)) {
      throw Error('Token validation failed');
    }

    // Prevent sensitive data from being written to DB
    return {
      ...message.payload,
      token: undefined,
    };
  },
});
```

By default, the (optionally parsed) payload will be accessible via [context](#context).

</details>

<details>

<summary>📖 Subscribe (onSubscribe)</summary>

#### Subscribe (onSubscribe)

Called when any subscription message is received.

```ts
const instance = makeServer({
  /* ... */
  onSubscribe: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>

<summary>📖 Complete (onComplete)</summary>

Called when any complete message is received.

```ts
const instance = makeServer({
  /* ... */
  onComplete: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>

<summary>📖 Error (onError)</summary>

Called when any error is encountered

```ts
const instance = makeServer({
  /* ... */
  onError: (error, context) => {
    /* */
  },
});
```

</details>


## Caveats

### Ping/Pong

For whatever reason, AWS API Gateway does not support WebSocket protocol level ping/pong. So you can use Step Functions to do this. See [`pingPong`](docs/interfaces/ServerArgs.md#pingpong).

### Socket idleness

API Gateway considers an idle connection to be one where no messages have been sent on the socket for a fixed duration [(currently 10 minutes)](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html#apigateway-execution-service-websocket-limits-table). The WebSocket spec has support for detecting idle connections (ping/pong) but API Gateway doesn't use it. This means, in the case where both parties are connected, and no message is sent on the socket for the defined duration (direction agnostic), API Gateway will close the socket. A fix for this is to set up immediate reconnection on the client side.
