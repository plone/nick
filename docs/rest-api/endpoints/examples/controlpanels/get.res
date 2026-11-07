HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@controlpanels/mail",
  "group": "General",
  "title": "Mail",
  "data": {
    "host": "localhost",
    "pass": null,
    "port": 25,
    "user": "",
    "debug": true,
    "secure": true,
    "email_from_name": "Webmaster",
    "email_from_address": "webmaster@plone.org",
    "transport": "smtp"
  },
  "schema": {
    "required": ["host", "port", "email_from_name", "email_from_address"],
    "fieldsets": [
      {
        "id": "default",
        "title": "Default",
        "fields": [
          "transport",
          "host",
          "port",
          "secure",
          "user",
          "pass",
          "email_from_name",
          "email_from_address",
          "debug"
        ]
      },
      {
        "id": "oauth",
        "title": "Microsoft 365 (OAuth)",
        "fields": ["oauth_client_id", "oauth_tenant_id", "oauth_client_secret"]
      }
    ],
    "properties": {
      "host": {
        "type": "string",
        "title": "SMTP server",
        "default": "localhost",
        "description": "The address of your local SMTP (outgoing email) server. Usually 'localhost', unless you use an external server to send email."
      },
      "pass": {
        "type": "string",
        "title": "ESMTP password",
        "widget": "password",
        "description": "The password for the ESMTP user account."
      },
      "port": {
        "type": "integer",
        "title": "SMTP port",
        "default": 25,
        "description": "The port of your local SMTP (outgoing email) server. Usually '25'."
      },
      "user": {
        "type": "string",
        "title": "ESMTP username",
        "description": "Username for authentication to your email server. Not required unless you are using ESMTP."
      },
      "debug": {
        "type": "boolean",
        "title": "Debug",
        "description": "If enabled, the mail is sent to a test server."
      },
      "secure": {
        "type": "boolean",
        "title": "Secure",
        "description": "If enabled, the mail is sent using a secure connection."
      },
      "email_from_name": {
        "type": "string",
        "title": "Site 'From' name",
        "description": "Nick generates email using this name as the email sender."
      },
      "email_from_address": {
        "type": "string",
        "title": "Site 'From' address",
        "description": "Nick generates email using this address as the email return address. It is also used as the destination address for the site-wide contact form and the “Send test email” feature."
      },
      "transport": {
        "type": "string",
        "title": "Mail transport",
        "default": "smtp",
        "choices": [
          ["smtp", "SMTP"],
          ["microsoft365", "Microsoft 365 (OAuth)"]
        ],
        "description": "How the mail is sent: through an SMTP server, or through Microsoft 365 using OAuth (set the application details on the Microsoft 365 tab)."
      },
      "oauth_client_id": {
        "type": "string",
        "title": "Application (client) ID",
        "description": "The application (client) ID of the app registration in Microsoft Entra ID. Used when the mail transport is Microsoft 365."
      },
      "oauth_tenant_id": {
        "type": "string",
        "title": "Tenant ID",
        "description": "The directory (tenant) ID of your Microsoft 365 tenant."
      },
      "oauth_client_secret": {
        "type": "string",
        "title": "Client secret",
        "widget": "password",
        "description": "The client secret value of the app registration. The app needs the Mail.Send application permission, and the mail is sent from the site 'From' address, which must be a mailbox in the tenant."
      }
    }
  }
}
