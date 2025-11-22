# Email Invitation Setup Guide

## Required Environment Variables

To enable email invitations in your Trello Clone app, you need to configure the following environment variables in your `.env.local` file:

### 1. RESEND_API_KEY

This is your API key from [Resend](https://resend.com) for sending emails.

**How to get it:**

1. Sign up or log in at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy the key

**Add to `.env.local`:**

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. NEXT_PUBLIC_APP_URL

This is the base URL of your application, used to generate the invite links.

**For development:**

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production:**

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Example .env.local

```bash
# Supabase Configuration (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (add these)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## After Adding Environment Variables

**Important:** You must restart your development server after adding or modifying environment variables:

1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again

## Testing the Invitation System

### Test Email Sending

1. Navigate to an organization in your dashboard
2. Click "Invite Members"
3. Enter a valid email address
4. Select a role (member/admin)
5. Click "Send Invite"
6. You should see a success message and the invite link

### Test Email Receipt

- Check the inbox of the invited email
- You should receive a beautifully formatted email with:
  - Organization name and description
  - Role assignment
  - "Accept Invitation" button
  - Backup invite link
  - 7-day expiration notice

### Test Link Sharing

If you don't want to wait for email delivery, you can:

1. Copy the invite link from the dialog after creating an invite
2. Open it in an incognito/private browser window
3. Log in with a different account (or create a new one)
4. Accept the invitation

## Troubleshooting

### Email Not Sending

- Verify `RESEND_API_KEY` is correct
- Check the dev server console for error messages
- Verify your Resend account is active and has sending credits

### Invite Link Not Working

- Verify `NEXT_PUBLIC_APP_URL` matches your current environment
- Check that the link hasn't expired (7 days from creation)
- Ensure you're logged in with the correct email address

### "Unauthorized" Errors

- The account accepting the invite must match the email address it was sent to
- Make sure you're logged in before clicking the invite link
