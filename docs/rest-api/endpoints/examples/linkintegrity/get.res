HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "@id": "http://localhost:8080/news",
    "@type": "Folder",
    "title": "News",
    "description": "News Items",
    "review_state": "published",
    "breaches": [
      {
        "@id": "http://localhost:8080/events",
        "uid": "1a2123ba-14e8-4910-8e6b-c04a40d72a41",
        "title": "Events"
      }
    ],
    "items_total": 1
  }
]