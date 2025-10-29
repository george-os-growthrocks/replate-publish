# Email Templates Setup

## How to Add Custom Email Templates to Supabase

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro
2. Click **Authentication** in the left sidebar
3. Click **Email Templates**

### Step 2: Update Email Templates

**For Confirmation Email:**
1. Find "Confirm signup" template
2. Copy the contents of `confirmation.html` from this folder
3. Paste it into the template editor
4. Click **Save**

**For Password Reset Email:**
1. Find "Reset password" template
2. Copy the contents of `reset-password.html` from this folder
3. Paste it into the template editor
4. Click **Save**

### Available Templates
- `confirmation.html` - Email confirmation when users sign up
- `reset-password.html` - Password reset email template

### Template Variables
Supabase provides these variables you can use:
- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

### Brand Colors Used
- Primary (Blue): `#4A90E2` (HSL 217 91% 60%)
- Secondary (Green): `#3DD68C` (HSL 142 69% 58%)
- Success: `#10b981` (Green)
- Background: `#0a0a0a` (Dark)
- Text: `#e5e7eb` (Light gray)
- Logo: `/logo-icon.png` hosted on Supabase Storage

### Features
✅ Responsive design
✅ Dark mode optimized
✅ Brand gradient colors
✅ Professional layout
✅ Clear CTA button
✅ Fallback text link
✅ What's Next section
✅ Support contact info
