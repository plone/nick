HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@querystring",
  "indexes": {
    "created": {
      "title": "Creation date",
      "description": "The date an item was created",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "Creator": {
      "title": "Creator",
      "description": "The person that created an item",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": "users",
      "operations": ["selection.any", "string.currentUser"],
      "operators": {
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        },
        "string.currentUser": {
          "title": "Current logged in user",
          "widget": null,
          "operation": "currentUser",
          "description": "The user viewing the querystring results"
        }
      }
    },
    "Description": {
      "title": "Description",
      "description": "An item’s description",
      "group": "Text",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": null,
      "operations": ["string.contains"],
      "operators": {
        "string.contains": {
          "title": "Contains",
          "widget": "StringWidget",
          "operation": "contains",
          "description": ""
        }
      }
    },
    "effective": {
      "title": "Effective date",
      "description": "The time and date an item was first published",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "end": {
      "title": "Event end date",
      "description": "The end date and time of an event",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "start": {
      "title": "Event start date",
      "description": "The start date and time of an event",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "expires": {
      "title": "Expiration date",
      "description": "The time and date an item was expired",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "path": {
      "title": "Location",
      "description": "The location of an item",
      "group": "Metadata",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": null,
      "operations": [
        "string.path",
        "string.absolutePath",
        "string.relativePath"
      ],
      "operators": {
        "string.path": {
          "title": "Navigation path",
          "widget": "ReferenceWidget",
          "operation": "navigationPath",
          "description": "Location in the navigation structure"
        },
        "string.absolutePath": {
          "title": "Absolute path",
          "widget": "ReferenceWidget",
          "operation": "absolutePath",
          "description": "Location in the site structure"
        },
        "string.relativePath": {
          "title": "Relative path",
          "widget": "RelativePathWidget",
          "operation": "relativePath",
          "description": "Use '../' to navigate to parent objects."
        }
      }
    },
    "modified": {
      "title": "Modification date",
      "description": "The time and date an item was last modified",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "review_state": {
      "title": "Review state",
      "description": "An item’s workflow state (e.g.published)",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": "workflowStates",
      "operations": ["selection.any"],
      "operators": {
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    },
    "SearchableText": {
      "title": "Searchable text",
      "description": "Text search of an item’s contents",
      "group": "Text",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": null,
      "operations": ["string.contains"],
      "operators": {
        "string.contains": {
          "title": "Contains",
          "widget": "StringWidget",
          "operation": "contains",
          "description": ""
        }
      }
    },
    "getId": {
      "title": "Short name (id)",
      "description": "The short name of an item (used in the url)",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": ["string.is"],
      "operators": {
        "string.is": {
          "title": "Is",
          "widget": "StringWidget",
          "operation": "equal",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    },
    "Subject": {
      "title": "Tag",
      "description": "Tags are used for organization of content",
      "group": "Text",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": "subjects",
      "operations": ["selection.all", "selection.any"],
      "operators": {
        "selection.all": {
          "title": "Matches all conditions",
          "widget": "MultipleSelectionWidget",
          "operation": "all",
          "description": "Tip: you can use * to autocomplete."
        },
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    },
    "Title": {
      "title": "Title",
      "description": "Text search of an item’s title",
      "group": "Text",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": null,
      "operations": ["string.contains"],
      "operators": {
        "string.contains": {
          "title": "Contains",
          "widget": "StringWidget",
          "operation": "contains",
          "description": ""
        }
      }
    },
    "portal_type": {
      "title": "Type",
      "description": "An item’s type (e.g. Event)",
      "group": "Metadata",
      "enabled": true,
      "sortable": false,
      "values": {},
      "vocabulary": "types",
      "operations": ["selection.any"],
      "operators": {
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    }
  },
  "sortable_indexes": {
    "created": {
      "title": "Creation date",
      "description": "The date an item was created",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "Creator": {
      "title": "Creator",
      "description": "The person that created an item",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": "users",
      "operations": ["selection.any", "string.currentUser"],
      "operators": {
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        },
        "string.currentUser": {
          "title": "Current logged in user",
          "widget": null,
          "operation": "currentUser",
          "description": "The user viewing the querystring results"
        }
      }
    },
    "effective": {
      "title": "Effective date",
      "description": "The time and date an item was first published",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "end": {
      "title": "Event end date",
      "description": "The end date and time of an event",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "start": {
      "title": "Event start date",
      "description": "The start date and time of an event",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "expires": {
      "title": "Expiration date",
      "description": "The time and date an item was expired",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "modified": {
      "title": "Modification date",
      "description": "The time and date an item was last modified",
      "group": "Dates",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": [
        "date.today",
        "date.between",
        "date.lessThan",
        "date.afterToday",
        "date.largerThan",
        "date.beforeToday",
        "date.afterRelativeDate",
        "date.beforeRelativeDate",
        "date.lessThanRelativeDate",
        "date.largerThanRelativeDate"
      ],
      "operators": {
        "date.today": {
          "title": "Today",
          "widget": null,
          "operation": "today",
          "description": "The current day"
        },
        "date.between": {
          "title": "Between dates",
          "widget": "DateRangeWidget",
          "operation": "between",
          "description": "Please use YYYY/MM/DD."
        },
        "date.lessThan": {
          "title": "Before date",
          "widget": "DateWidget",
          "operation": "lessThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.afterToday": {
          "title": "After today",
          "widget": null,
          "operation": "afterToday",
          "description": "After the current day"
        },
        "date.largerThan": {
          "title": "After date",
          "widget": "DateWidget",
          "operation": "largerThan",
          "description": "Please use YYYY/MM/DD."
        },
        "date.beforeToday": {
          "title": "Before today",
          "widget": null,
          "operation": "beforeToday",
          "description": "Before the current day"
        },
        "date.afterRelativeDate": {
          "title": "After relative date",
          "widget": "RelativeDateWidget",
          "operation": "afterRelativeDate",
          "description": "After N days in the future"
        },
        "date.beforeRelativeDate": {
          "title": "Before relative date",
          "widget": "RelativeDateWidget",
          "operation": "beforeRelativeDate",
          "description": "Before N days in the past"
        },
        "date.lessThanRelativeDate": {
          "title": "Within next",
          "widget": "RelativeDateWidget",
          "operation": "lessThanRelativeDate",
          "description": "Please enter the number in days."
        },
        "date.largerThanRelativeDate": {
          "title": "Within last",
          "widget": "RelativeDateWidget",
          "operation": "moreThanRelativeDate",
          "description": "Please enter the number in days."
        }
      }
    },
    "review_state": {
      "title": "Review state",
      "description": "An item’s workflow state (e.g.published)",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": "workflowStates",
      "operations": ["selection.any"],
      "operators": {
        "selection.any": {
          "title": "Matches any condition",
          "widget": "MultipleSelectionWidget",
          "operation": "contains",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    },
    "getId": {
      "title": "Short name (id)",
      "description": "The short name of an item (used in the url)",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "values": {},
      "vocabulary": null,
      "operations": ["string.is"],
      "operators": {
        "string.is": {
          "title": "Is",
          "widget": "StringWidget",
          "operation": "equal",
          "description": "Tip: you can use * to autocomplete."
        }
      }
    }
  }
}
