Skill Swap Hub
1. Install Node.js 18 or newer (nodejs.org), open a terminal in this folder.
2. Run:  node server.js     then open http://localhost:3000

What happens when:
  - Forgot password -> a 6-digit code is sent by SMS to the mobile number saved in the account
    (you can type either the email or the mobile number; old accounts with no mobile get it by email).
  - Learner sends a request -> the mentor gets an email at the address they signed in with
    (a direct request goes to that mentor; an open request goes to every mentor of that skill).
  - Mentor accepts -> the meeting link is emailed to both.

To turn on the real messages (set before running node server.js):
  SMS for reset codes (pick ONE):
     India:   FAST2SMS_API_KEY=<key from fast2sms.com > Dev API>
     Twilio:  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=<your Twilio number>
  Emails (request alerts to mentors, meeting link, reset fallback):
     GMAIL_USER=you@gmail.com   GMAIL_APP_PASSWORD=<16-char Google App Password>
  Google sign-in:
     GOOGLE_CLIENT_ID=<OAuth Web client ID from console.cloud.google.com>
     (add your site address under "Authorized JavaScript origins")
Without these, the SMS/emails are printed in the terminal and the Google button explains it is off.

Host on Render / Railway / a VPS to let other people use it (start command: node server.js).
Users and requests are saved in data.json next to server.js, so on Render use a persistent disk
or the data is lost on every redeploy.
