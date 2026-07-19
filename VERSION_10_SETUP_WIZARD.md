# Version 10 Setup Wizard

Open **Admin → Unlock Admin → Version 10 Setup Wizard**.

The wizard can configure:

- App name, short name, splash tagline, entry button, and home-page wording
- Firebase family workspace path
- Primary administrator email
- Primary and accent colors
- Optional Chat, Media, Scrapbook, Voting, Budgets, Maps, and Weather modules
- Firebase public web configuration
- Firebase Web Push public key
- Exportable template settings JSON

## Important limits

The wizard changes the running app configuration. For a completely separate new app, also copy the repository, create a new Firebase project, publish the included rules, deploy the Cloud Function, and update the administrator email in `database.rules.json` before deployment.

Never place a Firebase service-account private key in this web app.
