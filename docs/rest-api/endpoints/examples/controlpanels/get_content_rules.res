HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@controlpanels/content-rules",
  "group": "Content",
  "title": "Content Rules",
  "items": [
    [
      {
        "@id": "http://localhost:8080/@controlpanels/content-rules/rule-1",
        "id": "rule-1",
        "title": "Content Rule 1",
        "description": "Description for Content Rule 1",
        "assigned": true,
        "enabled": false,
        "trigger": "onAfterAdd"
      },
      {
        "@id": "http://localhost:8080/@controlpanels/content-rules/rule-2",
        "id": "rule-2",
        "title": "Content Rule 2",
        "description": "Description for Content Rule 2",
        "assigned": false,
        "enabled": false,
        "trigger": "onAfterDelete"
      }
    ]
  ]
}