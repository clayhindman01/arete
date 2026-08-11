# Specification

## Summary

- **Feature**: Account forgot password
- **User**: All
- **Goal**: undefined
- **Success**: If the user is able to reset their password and then successfully sign in using the new password

## User Story

As a All, I want Account forgot password so that Allow the user to click on a link to reset their password if they cannot remember it. I am using supabase with email and password, so the link should be sent to the email address entered by the user if it exists. The option to forget password should show up in the error handling for incorrect authentication details, it shouldnt be always visible..

## Acceptance Criteria

- [ ] Same as in-scope items

## In Scope

- **In Scope**:
- Link to reset password appears in the error handling for incorrect authentication details.
- Link should direct them to a page that will have them enter their email address. Upon entering the email address and clicking the "Reset Password"button, a link to reset their password should be sent to that email if there is an account associated with the email account. Do not display to the user if there is or is not an account associated with that email as that would be a security risk, simply state that an email will be sent to the email if an associated account exists.
- The link to reset the password should be functional. The user should be able to reset their password through the link.
- Upon returning to the application, the user should be able to sign in using the recently set password.
- **Out of Scope**:
- (none)

## Out of Scope



## Constraints

- Entered email must be a valid email

## Implementation Notes

- No implementation notes yet.

## Open Questions

- (none)
