# MgreSV Username-only Profile Update

Changed:
- Removed `Nama tampilan` from Register page.
- Removed `Nama tampilan` from Account/Edit Profile page.
- Profile preview now shows username only.
- Review still uses username from profile.
- Username is now free text:
  - spaces allowed
  - uppercase allowed
  - lowercase allowed
  - max 40 chars
  - only `<` and `>` are stripped for safety

Database:
- No required migration.
- Existing `display_name` column can stay; UI no longer uses it.
