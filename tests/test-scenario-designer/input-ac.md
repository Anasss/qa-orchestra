# Ticket #87 — Email validation on signup form

## Description

As a user signing up for an account, I want the email field to be validated before I submit the form so I get immediate feedback on bad input and don't have to wait for a server round trip.

## Acceptance Criteria

- **AC-1**: Signup form rejects empty email with the message "Email is required"
- **AC-2**: Signup form rejects malformed email (e.g., `abc`, `abc@`, `@xyz.com`) with the message "Please enter a valid email"
- **AC-3**: Signup form rejects email already in the database with the message "An account with this email already exists"
- **AC-4**: Validation triggers on blur and on form submit
- **AC-5**: Valid email shows no error and allows form submission
