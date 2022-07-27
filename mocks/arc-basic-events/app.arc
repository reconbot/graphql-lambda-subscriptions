@app
basic-events

@ws

@tables
Connection
  id *String
  ttl TTL
Subscription
  id *String
  ttl TTL

@tables-indexes
Subscription
  connectionId *String
  name ConnectionIndex

Subscription
  topic *String
  name TopicIndex
