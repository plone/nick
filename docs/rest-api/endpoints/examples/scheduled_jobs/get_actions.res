HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "@schema": {
      "fieldsets": [
        {
          "fields": [
            "type"
          ],
          "id": "default",
          "title": "Default"
        }
      ],
      "properties": {
        "type": {
          "additionalItems": true,
          "description": "The content type to reindex.",
          "factory": "Multiple Choice",
          "items": {
            "description": "",
            "factory": "Choice",
            "title": "",
            "type": "string",
            "vocabulary": {
              "@id": "types"
            }
          },
          "title": "Content type",
          "type": "array",
          "uniqueItems": true
        }
      },
      "required": [
        "type"
      ],
      "type": "object"
    },
    "addview": "reindex",
    "description": "Reindex items based on type",
    "title": "Reindex items"
  }
]