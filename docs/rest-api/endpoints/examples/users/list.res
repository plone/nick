HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "@id": "http://localhost:8080/@users/admin",
    "description": "Admin user",
    "id": "admin",
    "location": "World",
    "fullname": "Admin",
    "email": "admin@example.com",
    "roles": [
      "Administrator"
    ],
    "groups": []
  },
  {
    "@id": "http://localhost:8080/@users/anonymous",
    "id": "anonymous",
    "fullname": "Anonymous",
    "email": "anonymous@example.com",
    "roles": [
      "Anonymous"
    ],
    "groups": []
  }
]
