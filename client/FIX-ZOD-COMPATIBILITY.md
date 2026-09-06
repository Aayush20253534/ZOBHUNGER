# Public form crash: Zod compatibility fix

Apply this correction after Parts 5 and 6. Their patch applications completed
successfully in the supplied terminal output.

The earlier schemas used `z.iso.date()` and `z.iso.datetime()`, which are Zod 4
APIs. Zod 3 does not expose `z.iso`, so importing the requirement schema throws
before the form renders. Contact and job pages also import the shared adapter,
which loads these schemas. This explains why the same error appears on more than
one page. See the [Zod migration guide](https://zod.dev/v4/changelog).

## What changes

- Add shared calendar-date and UTC timestamp schemas using APIs available in
  both Zod 3 and Zod 4. Invalid dates, including February 31, remain rejected.
- Update the workforce requirement and job application date fields to use them.
- Replace the Zod 4-only numeric error option while retaining whole-number
  limits and the existing friendly message for missing or invalid headcounts.

No dependency installation is needed to apply this correction.

## Apply and restart

Stop the running development server with **Ctrl+C**, save the correction patch
in the project root, then run:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-zod-compat-fix.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-zod-compat-fix.patch
if ($LASTEXITCODE -ne 0) { throw "Patch could not be applied." }

npm run dev:client
```

Reload `/hire-workforce`, `/contact`, `/jobs` and a demo job detail page. Valid
submissions in mock mode still return a preview; nothing is delivered or saved.

## Validation

The original shared-adapter import crash was reproduced with Zod 3 before the
fix. Five regression checks then passed with each of Zod 3.25.76 and Zod 4.5.4:
calendar dates, UTC timestamps, workforce counts, React Hook Form resolver
behaviour, and all three mock form submissions. Production builds and TypeScript
also passed with both versions in the reconstructed project.

Patch application was checked against the delivered Part 6 baseline using LF,
CRLF and mixed line endings. The actual Windows checkout was not available.
This correction addresses the reported runtime error; it does not establish
whether any separate visual issue remains in the local browser.

## Commit message

```text
fix(client): support Zod 3 and 4 in public form validation

- replace incompatible date APIs with shared calendar validators
- preserve workforce count validation and form error messages
- restore shared adapter loading for contact, hiring and job pages
```
