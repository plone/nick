HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/events/event-1/@comments",
  "items": [
    {
      "@id": "http://localhost:8080/events/event-1/@comments/3d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "@parent": null,
      "author_name": "",
      "author_username": "admin",
      "can_reply": true,
      "comment_id": "3d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "creation_date": "2022-04-02T20:10:00.000Z",
      "in_reply_to": null,
      "is_deletable": true,
      "is_editable": true,
      "modification_date": "2022-04-02T20:10:00.000Z",
      "text": {
        "data": "Comment 1",
        "mime-type": "text/plain"
      }
    },
    {
      "@id": "http://localhost:8080/events/event-1/@comments/4d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "@parent": "http://localhost:8080/events/event-1/@comments/3d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "author_name": "",
      "author_username": "admin",
      "can_reply": true,
      "comment_id": "4d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "creation_date": "2022-04-02T20:10:00.000Z",
      "in_reply_to": "3d61035e-1fd3-435a-85a8-c44863f3a2dd",
      "is_deletable": true,
      "is_editable": true,
      "modification_date": "2022-04-02T20:10:00.000Z",
      "text": {
        "data": "Comment 1.1",
        "mime-type": "text/plain"
      }
    }
  ],
  "items_total": 2,
  "permissions": {
    "can_reply": true,
    "view_comments": true
  }
}