HTTP/1.1 200 OK
Content-Type: application/json

{
  "fieldsets": [
    {
      "fields": [
        "fullname",
        "email",
        "username",
        "password",
        "password_ctl",
        "mail_me"
      ],
      "id": "default",
      "title": "Default"
    }
  ],
  "properties": {
    "email": {
      "description": "We will use this address if you need to recover your password",
      "title": "Email",
      "type": "string",
      "widget": "email"
    },
    "fullname": {
      "description": "Enter full name, for example, John Smith.",
      "title": "Full Name",
      "type": "string"
    },
    "mail_me": {
      "default": false,
      "description": "",
      "title": "Send a confirmation mail with a link to set the password",
      "type": "boolean"
    },
    "password": {
      "description": "Enter your new password.",
      "title": "Password",
      "type": "string",
      "widget": "password"
    },
    "password_ctl": {
      "description": "Re-enter the password. Make sure the passwords are identical.",
      "title": "Confirm password",
      "type": "string",
      "widget": "password"
    },
    "username": {
      "description": "Enter a user name, usually something like 'jsmith'. No spaces or special characters. Usernames and passwords are case sensitive, make sure the caps lock key is not enabled. This is the name used to log in.",
      "title": "Username",
      "type": "string"
    }
  },
  "required": [
    "email",
    "username",
    "password",
    "password_ctl"
  ]
}
