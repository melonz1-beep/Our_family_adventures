# Our Family Adventures 10.3.9 security deployment

Version 10.3.9 removes client-side membership creation and moves invitations, role changes, and notification queuing behind Cloud Functions. Deploy the Firebase backend before relying on the updated web client.

From the repository root in Codespaces:

```bash
npm ci --prefix Functions
npx firebase-tools login --no-localhost
npx firebase-tools use our-family-adventures
npx firebase-tools deploy --only database,firestore,storage,functions
```

Then merge the 10.3.9 pull request so GitHub Pages publishes the matching app files. After deployment, sign in once with the existing Administrator account. The authorization function removes legacy invitation copies and the old shared Admin PIN from `publicData`.

Important:

- Existing active members continue to work.
- New invitees must verify their Firebase Authentication email before joining.
- An Administrator account can no longer be created from an editable email setting.
- Do not deploy only Hosting or only the rules; the 10.3.9 client and Functions are designed to be deployed together.
