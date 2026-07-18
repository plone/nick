HTTP/1.1 201 Created
Content-Type: application/json

{
  "@id": "http://localhost:8080/@scheduled-jobs/reindex-pages",
  "id": "reindex-pages",
  "title": "Reindex Pages",
  "description": "Reindex all pages",
  "enabled": true,
  "action": "reindex",
  "params": {
      "type": "Page"
  },
  "schedule": "0 0 * * *"
}
