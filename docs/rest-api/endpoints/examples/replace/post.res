HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@replace",
  "changes": [
    {
      "title": "Events",
      "path": "/events",
      "fields": [
        "title"
      ]
    },
    {
      "title": "Event 1",
      "path": "/events/event-1",
      "fields": [
        "title"
      ]
    },
    {
      "title": "Event 2",
      "path": "/events/event-2",
      "fields": [
        "title"
      ]
    }
  ]
}