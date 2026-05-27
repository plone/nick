HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@controlpanels/content-rules/rule-1",
  "id": "rule-1",
  "title": "Content Rule 1",
  "description": "Description for Content Rule 1",
  "assigned": true,
  "enabled": false,
  "trigger": "onAfterAdd",
  "actions": [
    {
      "description": "Perform a workflow transition on the triggering object",
      "first": true,
      "idx": 0,
      "last": false,
      "summary": "Execute transition publish",
      "title": "Transition workflow state"
    },
    {
      "description": "Log a particular event",
      "first": false,
      "idx": 1,
      "last": true,
      "summary": "Log message Test message",
      "title": "Logger"
    }
  ],
  "conditions": [
    {
      "description": "Apply only to a particular file extension",
      "first": true,
      "idx": 0,
      "last": false,
      "summary": "File extension is jpg",
      "title": "File Extension"
    },
    {
      "description": "Apply only to a objects in a particular workflow state",
      "first": false,
      "idx": 1,
      "last": true,
      "summary": "Workflow states are: private",
      "title": "Workflow state"
    }
  ],
  "cascading": false,
  "stop": false,
  "event": "onAfterAdd",
  "addable_actions": [
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["target_folder"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "target_folder": {
            "description": "As a path relative to the portal root.",
            "factory": "Relation Choice",
            "title": "Target folder",
            "widget": "object_browser"
          }
        },
        "required": ["target_folder"],
        "type": "object"
      },
      "addview": "copy_item",
      "description": "Copy the triggering item to a specific folder",
      "title": "Copy to folder"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": [],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {},
        "required": [],
        "type": "object"
      },
      "addview": "delete_item",
      "description": "Delete the triggering item",
      "title": "Delete item"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["message"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "message": {
            "default": "",
            "description": "&e = the triggering event, &c = the context, &u = the user",
            "factory": "Text line (String)",
            "title": "Message",
            "type": "string"
          }
        },
        "required": ["message"],
        "type": "object"
      },
      "addview": "logger",
      "description": "Log a particular event",
      "title": "Logger"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["target_folder"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "target_folder": {
            "description": "As a path relative to the portal root.",
            "factory": "Relation Choice",
            "title": "Target folder",
            "widget": "object_browser"
          }
        },
        "required": ["target_folder"],
        "type": "object"
      },
      "addview": "move_item",
      "description": "Move the triggering item to a specific folder",
      "title": "Move to folder"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": [
              "subject",
              "source",
              "recipients",
              "exclude_actor",
              "message"
            ],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "exclude_actor": {
            "description": "Do not send the email to the user that did the action.",
            "factory": "Yes/No",
            "title": "Exclude actor from recipients",
            "type": "boolean"
          },
          "message": {
            "description": "The message that you want to mail.",
            "factory": "Text",
            "title": "Message",
            "type": "string",
            "widget": "textarea"
          },
          "recipients": {
            "description": "The email where you want to send this message. To send it to different email addresses, just separate them with ,",
            "factory": "Text line (String)",
            "title": "Email recipients",
            "type": "string"
          },
          "source": {
            "description": "The email address that sends the email. If no email is provided here, it will use the portal from address.",
            "factory": "Text line (String)",
            "title": "Email source",
            "type": "string"
          },
          "subject": {
            "description": "Subject of the message",
            "factory": "Text line (String)",
            "title": "Subject",
            "type": "string"
          }
        },
        "required": ["subject", "recipients", "message"],
        "type": "object"
      },
      "addview": "send_email",
      "description": "Send an email on the triggering object",
      "title": "Send email"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["transition"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "transition": {
            "description": "Select the workflow transition to attempt",
            "factory": "Choice",
            "title": "Transition",
            "type": "string",
            "vocabulary": {
              "@id": "workflowTransitions"
            }
          }
        },
        "required": ["transition"],
        "type": "object"
      },
      "addview": "transition_workflow",
      "description": "Perform a workflow transition on the triggering object",
      "title": "Transition workflow state"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["comment"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "comment": {
            "description": "The comment added to the history while versioning the content.",
            "factory": "Text line (String)",
            "title": "Comment",
            "type": "string"
          }
        },
        "required": [],
        "type": "object"
      },
      "addview": "version_item",
      "description": "Store a new version of the item",
      "title": "Version item"
    }
  ],
  "addable_conditions": [
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["check_types"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "check_types": {
            "additionalItems": true,
            "description": "The content type to check for.",
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
        "required": ["check_types"],
        "type": "object"
      },
      "addview": "content_type",
      "description": "Apply only when the current content object is of a particular type",
      "title": "Content type"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["file_extension"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "file_extension": {
            "description": "The file extension to check for",
            "factory": "Text line (String)",
            "title": "File extension",
            "type": "string"
          }
        },
        "required": ["file_extension"],
        "type": "object"
      },
      "addview": "file_extension",
      "description": "Apply only to a particular file extension",
      "title": "File Extension"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["group_names"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "group_names": {
            "additionalItems": true,
            "description": "The name of the group.",
            "factory": "Multiple Choice",
            "items": {
              "description": "",
              "factory": "Choice",
              "title": "",
              "type": "string",
              "vocabulary": {
                "@id": "groups"
              }
            },
            "title": "Group name",
            "type": "array",
            "uniqueItems": true
          }
        },
        "required": ["group_names"],
        "type": "object"
      },
      "addview": "user_group",
      "description": "Apply only when the current user is in the given group",
      "title": "User’s group"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["role_names"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "role_names": {
            "additionalItems": true,
            "description": "The roles to check for.",
            "factory": "Multiple Choice",
            "items": {
              "description": "",
              "factory": "Choice",
              "title": "",
              "type": "string",
              "vocabulary": {
                "@id": "roles"
              }
            },
            "title": "Roles",
            "type": "array",
            "uniqueItems": true
          }
        },
        "required": ["role_names"],
        "type": "object"
      },
      "addview": "user_role",
      "description": "Apply only when the current user has the given role",
      "title": "User’s role"
    },
    {
      "@schema": {
        "fieldsets": [
          {
            "fields": ["wf_states"],
            "id": "default",
            "title": "Default"
          }
        ],
        "properties": {
          "wf_states": {
            "additionalItems": true,
            "description": "The workflow states to check for.",
            "factory": "Multiple Choice",
            "items": {
              "description": "",
              "factory": "Choice",
              "title": "",
              "type": "string",
              "vocabulary": {
                "@id": "workflowStates"
              }
            },
            "title": "Workflow state",
            "type": "array",
            "uniqueItems": true
          }
        },
        "required": ["wf_states"],
        "type": "object"
      },
      "addview": "workflow_state",
      "description": "Apply only to a objects in a particular workflow state",
      "title": "Workflow state"
    }
  ],
  "assignments": [
    {
      "description": "",
      "title": "Events",
      "url": "http://localhost:8080/events"
    }
  ]
}