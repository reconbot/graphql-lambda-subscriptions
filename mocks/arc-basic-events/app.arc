@app
basic-events

@ws

@static
folder dist

@tables
Connection
  id *String
  ttl TTL
Subscription
  id *String
  ttl TTL

@indexes

Subscription
  connectionId *String
  name ConnectionIndex

Subscription
  topic *String
  name TopicIndex
