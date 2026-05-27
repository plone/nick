HTTP/1.1 200 OK
Content-Type: application/json

{
  "fieldsets": [
    {
      "behavior": "default",
      "fields": [
        "fullname",
        "email",
        "description",
        "home_page",
        "location",
        "portrait"
      ],
      "id": "default",
      "title": "Default"
    }
  ],
  "properties": {
    "description": {
      "behavior": "custom",
      "description": "A short overview of who you are and what you do. Will be displayed on your author page, linked from the items you create.",
      "title": "Biography",
      "type": "string",
      "widget": "textarea"
    },
    "email": {
      "behavior": "default",
      "description": "We will use this address if you need to recover your password",
      "title": "Email",
      "type": "string",
      "widget": "email"
    },
    "fullname": {
      "behavior": "default",
      "description": "Enter full name, for example, John Smith.",
      "title": "Full Name",
      "type": "string"
    },
    "home_page": {
      "behavior": "custom",
      "description": "The URL for your external home page, if you have one.",
      "title": "Home Page",
      "type": "string",
      "widget": "url"
    },
    "location": {
      "behavior": "custom",
      "description": "Your location - either city and country - or in a company setting, where your office is located.",
      "title": "Location",
      "type": "string"
    },
    "portrait": {
      "behavior": "custom",
      "description": "Your portrait photo.",
      "factory": "Image",
      "title": "Portrait",
      "type": "object",
      "widget": "file"
    }
  },
  "required": [
    "email"
  ]
}
