# Admin two-factor authentication (2FA) — operator runbook

Admins can protect their sign-in with an authenticator app (TOTP: Google Authenticator,
Microsoft Authenticator, 1Password, …). With 2FA on, `/admin/login` asks for the password
and then a 6-digit code (or a backup code).

Requires `TWO_FACTOR_ENCRYPTION_KEY` in the environment (see `.env.example`;
generate with `node scripts/gen-2fa-key.js`).

## Enrol

1. Sign in, open **/admin/security**, card **Two-Factor Authentication**.
2. **Enable 2FA** → scan the QR code (or type the key) in the authenticator app.
3. Enter the 6-digit code → **Confirm**.
4. Save the 10 backup codes (**Download .txt**), tick **I have saved these codes**, **Done**.
   They are shown once and never again — only their hashes are stored.

## Regenerate backup codes

**/admin/security** → **Regenerate backup codes** → password + a current authenticator code
(or one unused backup code). All old codes stop working; the 10 new ones are shown once.

## Disable 2FA

**/admin/security** → **Disable 2FA** → password + a current authenticator code (or one
unused backup code). Clears the authenticator setup and all backup codes; sign-in is
password-only until 2FA is enabled again.

## Locked out (lost phone AND lost backup codes)

An operator with database access runs, from the repo root:

```bash
node scripts/reset-admin-2fa.js admin@example.com          # asks you to type YES
node scripts/reset-admin-2fa.js admin@example.com --yes    # no prompt
NODE_ENV=production node scripts/reset-admin-2fa.js admin@example.com --yes --force
```

`--force` is required whenever `NODE_ENV=production`. The script reads `DATABASE_URL`
from the environment / `.env.local`.

**What it changes** (that user only): `twoFactorEnabled=false`, `twoFactorSecret=null`,
`twoFactorBackupCodes=[]`, `twoFactorLastUsedStep=null`, plus that admin's own 2FA
rate-limit counters (`admin-login-2fa-user`, `admin-2fa-disable`). It prints one audit
line (time, email, operator, fields cleared) and the number of counters removed.
Per-IP counters (`admin-login-2fa-ip`) cannot be tied to one admin and simply expire.

**What it does NOT change:** the password, the role, and any session already issued.
After a reset the admin signs in with their password alone and should enrol again.

Sessions are stateless JWTs and cannot be revoked one by one. If you suspect an admin
session was stolen, rotate `JWT_SECRET` in Vercel and redeploy — that signs **everyone**
out (customers too) and invalidates open password-reset links and pending 2FA logins.

It refuses non-admin users ("is not an admin") and unknown emails ("not found").
Exit codes: `0` success, `1` usage / permission / not found / aborted, `2` unexpected error.

## Keys

- **`TWO_FACTOR_ENCRYPTION_KEY`** encrypts every stored authenticator secret. Changing or
  losing it makes every enrolled secret unreadable: **every admin with 2FA must be reset
  (script above) and re-enrol.** Keep it stable and backed up like any production secret.
- **`JWT_SECRET`** signs sessions and the 5-minute pending-2FA token. Rotating it does not
  affect enrolled 2FA secrets.

**Warning — `ADMIN_2FA_REQUIRED=true`:** an admin without 2FA can then only reach
/admin/security, so anyone holding that admin's password can enrol their own authenticator
before the real admin does. Turn enforcement on only after every admin has enrolled.
