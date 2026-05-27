HTTP/1.1 200 OK
Content-Type: application/json

{
  "content-rules": {
    "acquired_rules": [],
    "assignable_rules": [
      {
        "id": "rule-2",
        "title": "Content Rule 2",
        "description": "Description for Content Rule 2"
      }
    ],
    "assigned_rules": [
      {
        "id": "rule-1",
        "title": "Content Rule 1",
        "description": "Description for Content Rule 1",
        "bubbles": true,
        "enabled": false,
        "global_enabled": false,
        "trigger": "onAfterAdd"
      }
    ]
  }
}