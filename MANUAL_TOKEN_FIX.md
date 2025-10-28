# 🔧 MANUAL TOKEN STORAGE FIX

If the automatic token storage isn't working, let's manually store your OAuth token.

## 🎯 STEP 1: Get Your Current Session Token

Open browser console (F12) and run:

```javascript
const { data } = await window.supabase.auth.getSession();
const token = data.session?.provider_token;
const refreshToken = data.session?.provider_refresh_token;
const expiresAt = data.session?.expires_at;

console.log('Provider Token:', token ? '✅ FOUND' : '❌ NOT FOUND');
console.log('Token value:', token);
console.log('Refresh Token:', refreshToken);
console.log('Expires At:', expiresAt);
```

**IF YOU SEE "❌ NOT FOUND"** → The problem is that Google isn't returning the token to Supabase. This means:
- Google OAuth scopes might not be correct
- OR you need to revoke access and sign in fresh

**IF YOU SEE "✅ FOUND"** → Continue to Step 2!

---

## 🎯 STEP 2: Manually Store the Token

If you got a token in Step 1, run this in console:

```javascript
const { data: session } = await window.supabase.auth.getSession();
const userId = session.session?.user?.id;
const token = session.session?.provider_token;
const refreshToken = session.session?.provider_refresh_token;
const expiresAt = session.session?.expires_at;

if (token) {
  const { data, error } = await window.supabase.functions.invoke('store-oauth-token', {
    body: {
      provider_token: token,
      provider_refresh_token: refreshToken,
      expires_at: expiresAt,
    }
  });
  
  console.log('✅ Token storage result:', data);
  console.log('❌ Error (if any):', error);
} else {
  console.log('❌ No token to store!');
}
```

---

## 🎯 STEP 3: Verify Token Was Stored

```javascript
const { data, error } = await window.supabase.from('user_oauth_tokens').select('*');
console.log('📊 Tokens in database:', data);
console.log('❌ Error (if any):', error);
```

You should see your token row with:
- `user_id`: Your user ID
- `provider`: 'google'
- `access_token`: (long string)
- `created_at`: (timestamp)

---

## 🎯 STEP 4: Test Chatbot

1. Refresh the page
2. Open chatbot
3. Click debug button
4. Check if `properties` array is now FILLED
5. Try asking a question!

---

## ❓ TROUBLESHOOTING:

### If Step 1 shows "NOT FOUND":

**Problem**: Google isn't returning the OAuth token.

**Solution**:
1. Go to https://myaccount.google.com/permissions
2. Find "AnotherSEOGuru" or your local app
3. Click "Remove access"
4. Go back to your app
5. Sign out
6. Sign in again
7. Make sure to grant ALL permissions

### If Step 2 shows an error:

Send me the EXACT error message from console, including:
- Error code
- Error message
- Stack trace

### If Step 3 shows empty array or error:

Send me:
- The error message
- Your user ID
- Whether you have RLS enabled

---

## 🚨 NUCLEAR OPTION: Direct Database Insert

If all else fails, we can insert directly into the database (requires service role key):

**DO NOT DO THIS unless I tell you to!** This bypasses RLS and requires careful handling.

---

## 📞 SEND ME:

After running Step 1, send me:
1. Whether you see "✅ FOUND" or "❌ NOT FOUND"
2. Any error messages from Step 2 or 3
3. The full console output

Then I can tell you exactly what's wrong! 🎯

