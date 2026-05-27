HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@controlpanels/dexterity-types/Page",
  "title": "Page",
  "description": "",
  "schema": {
    "fieldsets": [
      {
        "fields": [
          "title",
          "description",
          "allowed_content_types",
          "filter_content_types"
        ],
        "id": "default",
        "title": "Default"
      },
      {
        "fields": [
          "basic",
          "blocks",
          "categorization",
          "dates",
          "dublin_core",
          "exclude_from_nav",
          "ownership",
          "preview_image_link",
          "short_name",
          "versioning"
        ],
        "id": "behaviors",
        "title": "Behaviors"
      }
    ],
    "properties": {
      "allowed_content_types": {
        "additionalItems": true,
        "description": "",
        "factory": "Multiple Choice",
        "items": {
          "description": "",
          "factory": "Choice",
          "title": "",
          "type": "string",
          "vocabulary": {
            "@id": "http://localhost:8080/@vocabularies/types"
          }
        },
        "title": "Allowed Content Types",
        "type": "array",
        "uniqueItems": true
      },
      "description": {
        "description": "",
        "factory": "Text",
        "title": "Description",
        "type": "string",
        "widget": "textarea"
      },
      "filter_content_types": {
        "factory": "Yes/No",
        "title": "Filter Contained Types",
        "description": "Items of this type can act as a folder containing other items. What content types should be allowed inside?",
        "type": "boolean"
      },
      "title": {
        "description": "",
        "factory": "Text line (String)",
        "title": "Type Name",
        "type": "string"
      },
      "basic": {
        "description": "Adds title and description fields.",
        "factory": "Yes/No",
        "title": "Basic metadata",
        "type": "boolean"
      },
      "blocks": {
        "description": "Enables Volto Blocks support",
        "factory": "Yes/No",
        "title": "Blocks",
        "type": "boolean"
      },
      "categorization": {
        "description": "Adds keywords and language fields.",
        "factory": "Yes/No",
        "title": "Categorization",
        "type": "boolean"
      },
      "dates": {
        "description": "Adds effective and expiration dates.",
        "factory": "Yes/No",
        "title": "Dates",
        "type": "boolean"
      },
      "dublin_core": {
        "description": "Adds standard metadatafields",
        "factory": "Yes/No",
        "title": "Dublin Core metadata",
        "type": "boolean"
      },
      "exclude_from_nav": {
        "description": "If selected, this item will not appear in the navigation tree.",
        "factory": "Yes/No",
        "title": "Exclude from navigation",
        "type": "boolean"
      },
      "ownership": {
        "description": "Adds ownership and rights fields.",
        "factory": "Yes/No",
        "title": "Ownership",
        "type": "boolean"
      },
      "preview_image_link": {
        "description": "Gives the ability to rename an item from its edit form.",
        "factory": "Yes/No",
        "title": "Preview Image Link",
        "type": "boolean"
      },
      "short_name": {
        "description": "Gives the ability to rename an item from its edit form.",
        "factory": "Yes/No",
        "title": "Short name",
        "type": "boolean"
      },
      "versioning": {
        "description": "Versioning support",
        "factory": "Yes/No",
        "title": "Versioning",
        "type": "boolean"
      }
    },
    "required": [
      "title",
      "filter_content_types"
    ]
  },
  "data": {
    "title": "Page",
    "description": "",
    "allowed_content_types": [],
    "filter_content_types": false,
    "basic": false,
    "blocks": true,
    "categorization": false,
    "dates": true,
    "dublin_core": true,
    "exclude_from_nav": true,
    "ownership": false,
    "preview_image_link": false,
    "short_name": true,
    "versioning": true
  }
}