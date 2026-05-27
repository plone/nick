HTTP/1.1 200 OK
Content-Type: application/json

{
  "users": [
    {
      "@id": "http://localhost:8080/@users/admin",
      "description": "Admin user",
      "id": "admin",
      "fullname": "Admin",
      "email": "admin@example.com",
      "location": "World",
      "roles": [
        "Administrator"
      ],
      "groups": []
    }
  ],
  "groups": [
    {
      "@id": "http://localhost:8080/@groups/Administrators",
      "description": "",
      "email": "",
      "groupname": "Administrators",
      "id": "Administrators",
      "roles": [
        "Administrator"
      ],
      "title": "Administrators"
    }
  ]
}
