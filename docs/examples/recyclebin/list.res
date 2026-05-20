HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@recyclebin",
  "items": [
    {
      "@id": "http://localhost:8080/events/event-3/@recyclebin/455ca717-0c68-43a0-88ac-629a72658675",
      "@type": "Event",
      "actions": [
        {
          "purge": "http://localhost:8080/events/event-3/@recyclebin/455ca717-0c68-43a0-88ac-629a72658675"
        },
        {
          "restore": "http://localhost:8080/events/event-3/@recyclebin/455ca717-0c68-43a0-88ac-629a72658675/restore"
        }
      ],
      "deleted_by": "admin",
      "deletion_date": "2023-04-02T20:10:00.000Z",
      "has_children": false,
      "id": "event-3",
      "language": "en",
      "parent_path": "/events",
      "path": "/events/event-3",
      "recycle_id": "455ca717-0c68-43a0-88ac-629a72658675",
      "review_state": "published",
      "title": "Event 3"
    }
  ]
}