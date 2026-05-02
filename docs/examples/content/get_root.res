HTTP/1.1 200 OK
Content-Type: application/json

{
  "title": "Welcome to Nick!",
  "blocks": {
    "79ba8858-1dd3-4719-b731-5951e32fbf79": {
      "@type": "title"
    },
    "0f06cd6f-5282-4966-9d4d-3abeba13953c": {
      "@type": "slate",
      "value": [
        {
          "type": "p",
          "children": [
            {
              "text": "This is the demo site of "
            },
            {
              "type": "link",
              "data": {
                "url": "https://nickcms.org"
              },
              "children": [
                {
                  "text": "Nick"
                }
              ]
            },
            {
              "text": " and is build with the "
            },
            {
              "type": "link",
              "data": {
                "url": "https://voltocms.com"
              },
              "children": [
                {
                  "text": "Volto"
                }
              ]
            },
            {
              "text": " frontend."
            }
          ]
        }
      ],
      "plaintext": "This is the demo site of Nick and is build with the Volto frontend."
    },
    "e47fdd86-5d1b-4e6c-86a4-f3edf9d74e31": {
      "@type": "slate",
      "value": [
        {
          "type": "h2",
          "children": [
            {
              "text": "Demo"
            }
          ]
        }
      ],
      "plaintext": "Demo"
    },
    "a6ba1f90-3bd0-4daa-869f-532c38d4c522": {
      "@type": "slate",
      "value": [
        {
          "type": "p",
          "children": [
            {
              "text": "You can use this site to test the latest version of Nick. You can login with "
            },
            {
              "type": "em",
              "children": [
                {
                  "text": "username"
                }
              ]
            },
            {
              "text": " "
            },
            {
              "type": "strong",
              "children": [
                {
                  "text": "admin"
                }
              ]
            },
            {
              "text": " and "
            },
            {
              "type": "em",
              "children": [
                {
                  "text": "password"
                }
              ]
            },
            {
              "text": " "
            },
            {
              "type": "strong",
              "children": [
                {
                  "text": "admin"
                }
              ]
            },
            {
              "text": "."
            }
          ]
        }
      ],
      "plaintext": "You can use this site to test the latest version of Nick. You can login with username  admin and password  admin ."
    },
    "59ddb72e-2691-4571-b07c-eedbd843b613": {
      "@type": "slate",
      "value": [
        {
          "type": "p",
          "children": [
            {
              "text": "This instance is reset every night so feel free to make any changes!"
            }
          ]
        }
      ],
      "plaintext": "This instance is reset every night so feel free to make any changes!"
    }
  },
  "blocks_layout": {
    "items": [
      "79ba8858-1dd3-4719-b731-5951e32fbf79",
      "0f06cd6f-5282-4966-9d4d-3abeba13953c",
      "e47fdd86-5d1b-4e6c-86a4-f3edf9d74e31",
      "a6ba1f90-3bd0-4daa-869f-532c38d4c522",
      "59ddb72e-2691-4571-b07c-eedbd843b613"
    ]
  },
  "effective": "2022-04-02T20:00:00.000Z",
  "description": "Congratulations! You have successfully installed Nick.",
  "items": [
    {
      "title": "Events",
      "blocks": { "79ba8858-1dd3-4719-b731-5951e32fbf79": { "@type": "title" } },
      "effective": "2022-04-02T20:30:00.000Z",
      "blocks_layout": { "items": ["79ba8858-1dd3-4719-b731-5951e32fbf79"] },
      "@id": "http://localhost:8080/events",
      "@type": "Folder",
      "id": "events",
      "created": "2022-04-02T20:30:00.000Z",
      "modified": "2022-04-02T20:30:00.000Z",
      "UID": "1a2123ba-14e8-4910-8e6b-c04a40d72a41",
      "owner": "admin",
      "layout": "view",
      "is_folderish": true,
      "language": { "token": "en", "title": "English" },
      "review_state": "published",
      "lock": { "locked": false, "stealable": true }
    },
    {
      "title": "News",
      "blocks": { "79ba8858-1dd3-4719-b731-5951e32fbf79": { "@type": "title" } },
      "effective": "2022-04-02T20:22:00.000Z",
      "description": "News Items",
      "blocks_layout": { "items": ["79ba8858-1dd3-4719-b731-5951e32fbf79"] },
      "@id": "http://localhost:8080/news",
      "@type": "Folder",
      "id": "news",
      "created": "2022-04-02T20:22:00.000Z",
      "modified": "2022-04-02T20:22:00.000Z",
      "UID": "32215c67-86de-462a-8cc0-eabcd2b39c26",
      "owner": "admin",
      "layout": "view",
      "is_folderish": true,
      "language": { "token": "en", "title": "English" },
      "review_state": "published",
      "lock": { "locked": false, "stealable": true }
    },
    {
      "title": "Users",
      "blocks": { "79ba8858-1dd3-4719-b731-5951e32fbf79": { "@type": "title" } },
      "effective": "2022-04-02T20:24:00.000Z",
      "blocks_layout": { "items": ["79ba8858-1dd3-4719-b731-5951e32fbf79"] },
      "@id": "http://localhost:8080/users",
      "@type": "Folder",
      "id": "users",
      "created": "2022-04-02T20:24:00.000Z",
      "modified": "2022-04-02T20:24:00.000Z",
      "UID": "80994493-74ca-4b94-9a7c-145a33a6dd80",
      "owner": "admin",
      "layout": "view",
      "is_folderish": true,
      "language": { "token": "en", "title": "English" },
      "review_state": "published",
      "lock": { "locked": false, "stealable": true }
    }
  ],
  "@components": {
    "catalog": { "@id": "http://localhost:8080/@catalog" },
    "contextnavigation": { "@id": "http://localhost:8080/@contextnavigation" },
    "actions": { "@id": "http://localhost:8080/@actions" },
    "breadcrumbs": { "@id": "http://localhost:8080/@breadcrumbs" },
    "navigation": { "@id": "http://localhost:8080/@navigation" },
    "navroot": { "@id": "http://localhost:8080/@navroot" },
    "related": { "@id": "http://localhost:8080/@related" },
    "types": { "@id": "http://localhost:8080/@types" },
    "workflow": { "@id": "http://localhost:8080/@workflow" },
    "translations": { "@id": "http://localhost:8080/@translations" }
  },
  "@id": "http://localhost:8080",
  "@type": "Site",
  "id": "root",
  "created": "2022-04-02T20:00:00.000Z",
  "modified": "2022-04-02T20:00:00.000Z",
  "UID": "92a80817-f5b7-400d-8f58-b08126f0f09b",
  "owner": "admin",
  "layout": "view",
  "is_folderish": true,
  "language": { "token": "en", "title": "English" },
  "review_state": "published",
  "lock": { "locked": false, "stealable": true }
}
