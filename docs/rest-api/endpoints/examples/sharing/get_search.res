HTTP/1.1 200 OK
Content-Type: application/json

{
  "available_roles": [
    {
      "id": "Anonymous",
      "title": "Anonymous"
    },
    {
      "id": "Authenticated",
      "title": "Authenticated"
    },
    {
      "id": "Owner",
      "title": "Owner"
    },
    {
      "id": "Reader",
      "title": "Reader"
    },
    {
      "id": "Contributor",
      "title": "Contributor"
    },
    {
      "id": "Editor",
      "title": "Editor"
    },
    {
      "id": "Reviewer",
      "title": "Reviewer"
    },
    {
      "id": "Administrator",
      "title": "Administrator"
    }
  ],
  "entries": [
    {
      "id": "admin",
      "title": "Admin",
      "roles": {
        "Anonymous": false,
        "Authenticated": false,
        "Owner": false,
        "Reader": false,
        "Contributor": false,
        "Editor": false,
        "Reviewer": false,
        "Administrator": "global"
      },
      "type": "user"
    },
    {
      "id": "Administrators",
      "title": "Administrators",
      "roles": {
        "Anonymous": false,
        "Authenticated": false,
        "Owner": false,
        "Reader": false,
        "Contributor": false,
        "Editor": false,
        "Reviewer": false,
        "Administrator": "global"
      },
      "type": "group"
    }
  ],
  "inherit": true
}
