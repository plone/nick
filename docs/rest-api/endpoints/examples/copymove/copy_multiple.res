HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "source": "http://localhost:8080/events",
    "target": "http://localhost:8080/news/events"
  },
  {
    "source": "http://localhost:8080/users",
    "target": "http://localhost:8080/news/users"
  }
]
