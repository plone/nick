HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/news/@workflow",
  "history": [],
  "state": {
    "id": "published",
    "title": "Published"
  },
  "transitions": [
    {
      "@id": "http://localhost:8080/news/@workflow/reject",
      "title": "Send back"
    },
    {
      "@id": "http://localhost:8080/news/@workflow/retract",
      "title": "Retract"
    }
  ]
}
