# 2FA Quick Start

## For Users

### Quick Setup (3 steps)

1. **Open Settings** → Click the **2FA** tab
2. **Choose a method**:
   - 🔐 Authenticator App (Recommended)
   - 📧 Email Verification
3. **Verify** with your password + code

### Login with 2FA

1. Enter username & password
2. Choose verification method
3. Enter code (from app or email)
4. Done! ✓

### Trusted Devices

After first login with 2FA:
- Device automatically saved as "Trusted"
- Next login: skip code, use device token
- Manage in Settings → 2FA → Trusted Devices

---

## For Administrators

### Step 1: Install Dependencies

```bash
cd server
npm install
# Already includes speakeasy and qrcode
```

### Step 2: Restart Server

```bash
node server.js
```

### Step 3: Update Config (If Needed)

Email 2FA requires:
```json
{
  "email": {
    "verificationEnabled": true,
    "gmail": {
      "user": "your-email@gmail.com",
      "appPassword": "xxxx xxxx xxxx xxxx"
    }
  }
}
```

### Step 4: Test

1. Login to web app
2. Go to User Settings → 2FA
3. Enable authenticator 2FA
4. Scan QR code with authenticator app
5. Logout and login to test

---

## Methods Comparison

| Feature | Authenticator | Email | Trusted Device |
|---------|---------------|-------|-----------------|
| Setup Time | 2-3 min | 1 min | Auto |
| Required Config | None | Email config | 2FA enabled |
| Security Level | Highest | High | Medium |
| Works Offline | Yes | No | Yes |
| Backup Secret | Yes | - | - |
| Speed | Instant | Seconds | Instant |

---

## Commands

### Server Setup
```bash
cd server
npm install    # Install deps
npm start      # Start server
```

### Features Enabled By Default
- ✅ Authenticator (TOTP) 2FA
- ✅ Email code 2FA (if email configured)
- ✅ Trusted device option
- ✅ Rate limiting on logins
- ✅ Session expiry (10 minutes)

---

## Security Features

- Password required to setup/disable 2FA
- 30-second TOTP window (industry standard)
- Email codes expire in 15 minutes
- Max 3 email attempts before reset
- Max 5 2FA attempts before session expires
- Unique device tokens
- Encrypted TOTP secrets

---

## Common Issues

### "QR Code not showing"
→ Install dependencies: `npm install`

### "Email code not received"
→ Check email config and Gmail app password

### "TOTP code always wrong"
→ Ensure device time is synchronized

### "Trusted device not working"
→ Must complete at least one 2FA verification first

---

## Support

Refer to `2FA_IMPLEMENTATION_GUIDE.md` for detailed information.

Questions? Report issues on GitHub! 🚀
