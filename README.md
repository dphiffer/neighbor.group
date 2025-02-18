# neighbor.group

Local group collaboration

## Dependencies

-   Node.js v22

## Development setup

```
npm install
npm run dev
```

## Environment variables

-   `PORT`: what port number the server runs on (default `3000`)
-   `HOST`: which hostname or IP to listen from (default `0.0.0.0`)
-   `DATABASE`: name of the site database file (default `main.db`)
-   `EMAIL_FROM`: the email "from" address for emails like password resets
-   `SMTP_HOST`: hostname of the SMTP server
-   `SMTP_PORT`: SMTP server port number
-   `SMTP_SECURE`: whether to connect to SMTP using SSL
-   `SMTP_USER`: SMTP username
-   `SMTP_PASS`: SMTP password

## Authentication

Neighbor.group relies on an email/password login. Password resets rely on email for forgotten passwords, which means configuring an SMTP server is essential for a working website.