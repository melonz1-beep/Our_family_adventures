# Our Family Adventures 9.3.1 — Role Management and Role Locks

Built on Version 9.3.0.

## Added
- Admin-only role editor on the People page.
- Roles: Family, Guest, Child, and Admin.
- Individual role lock for each person.
- Global **Lock role editing** option in Admin Locks.
- The primary admin email cannot be accidentally demoted.
- Signed-in users receive the role stored in their linked People profile instead of inheriting a prior device's Admin status.
- Sign-in and sign-out messages now show the actual account role.

## Deploy
Upload every file and folder in this package to the repository root, replacing the prior version. Open `?v=9.3.1` once after deployment and refresh.

No Firebase rule change is required if the Version 9.3.0 invitation rules are already published. Role data is saved within the protected `publicData` path. Only use the role editor while Admin is unlocked.
