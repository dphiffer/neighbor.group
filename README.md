# neighbor.group

Local group collaboration

## Dependencies

-   Node.js v22
-   nvm

## Development setup

```
nvm use
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

Currently neighbor.group relies on an email/password login. Password resets are available for forgotten passwords. There are some limits built in, currently hardcoded:

- 5 login errors per IP address/day
- 5 signup errors per IP address/day
- 5 password reset errors per IP address/day

If you hit the daily error limit you will need to wait until the next day to try again. These may need to be adjusted once the software sees some actual use.