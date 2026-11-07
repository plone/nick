---
title: Mail
nav_order: 13
permalink: /admin-guide/mail
parent: Admin guide
---

# Mail

Nick sends mail (contact forms, notifications, content rules and password resets) using the settings of the `mail` control panel. There are two transports.

## SMTP

The default. Set the SMTP server, port, secure connection and, if needed, the user name and password.

## Microsoft 365 (OAuth)

Sends mail through the Microsoft Graph API using the client credentials flow, without a user name and password. Nick builds the full message (HTML, attachments, Bcc) and Graph sends it from a mailbox in your tenant.

### Set up the app registration

1. In the Microsoft Entra admin center, create an app registration (_App registrations_, _New registration_).
2. Under _API permissions_, add the Microsoft Graph _application_ permission `Mail.Send` and grant admin consent.
3. Under _Certificates & secrets_, create a client secret and copy its value.
4. From the overview page, copy the _Application (client) ID_ and the _Directory (tenant) ID_.

`Mail.Send` allows the app to send as any mailbox in the tenant. To limit it to the mailbox of the site, create an [application access policy](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access) in Exchange Online.

### Configure Nick

In the mail control panel (_Site Setup_, _Mail_):

- Set _Mail transport_ to _Microsoft 365 (OAuth)_.
- On the _Microsoft 365 (OAuth)_ tab, fill in the _Application (client) ID_, _Tenant ID_ and _Client secret_. The secret is never returned by the API; leave it empty to keep the stored value.
- Set the _Site 'From' address_ to the mailbox that sends the mail. It has to be a user or shared mailbox in the tenant.
- Turn off _Debug_, otherwise the mail goes to the test server.

Access tokens are cached in memory until shortly before they expire.

### Upgrading

Existing sites get the new fields with `pnpm seed:upgrade` (upgrade 1019). The transport is set to SMTP, so nothing changes until you switch it.
