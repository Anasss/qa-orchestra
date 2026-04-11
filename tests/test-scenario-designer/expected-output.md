Ticket: #87 — Email validation on signup form

# Test Scenarios

## Summary

Tests cover 5 ACs across happy path, negative, boundary, and state-transition dimensions. Email validation is a well-studied input-validation domain, so the scenario count is deliberately high (15) to cover the malformed-input space properly.

**Count by priority**: 8 Must Test · 4 Should Test · 3 Nice to Have

---

## AC-1 — Empty email rejected

### TC-01
**Title**: Submitting signup form with empty email shows required-field error
**Priority**: Must Test
**Dimension**: Negative
**Preconditions**: Signup form is rendered.
**Steps**:
1. Fill all other required fields with valid data.
2. Leave the email field empty.
3. Click Submit.

**Expected**: Form does not submit. Error "Email is required" appears next to the email field. No network request to the signup endpoint.

### TC-02
**Title**: Blurring empty email field after focus shows required-field error
**Priority**: Must Test
**Dimension**: State transition
**Steps**:
1. Click into the email field (focus).
2. Click out of the field (blur) without typing anything.

**Expected**: Error "Email is required" appears inline next to the field, without needing to click Submit.

---

## AC-2 — Malformed email rejected

### TC-03
**Title**: Email missing `@` shows validation error
**Priority**: Must Test
**Dimension**: Negative
**Steps**:
1. Type `abc` into the email field.
2. Blur the field.

**Expected**: Error "Please enter a valid email" appears.

### TC-04
**Title**: Email missing domain shows validation error
**Priority**: Must Test
**Dimension**: Negative
**Steps**:
1. Type `abc@` into the email field.
2. Blur.

**Expected**: Error "Please enter a valid email" appears.

### TC-05
**Title**: Email missing local part shows validation error
**Priority**: Must Test
**Dimension**: Negative
**Steps**:
1. Type `@xyz.com` into the email field.
2. Blur.

**Expected**: Error "Please enter a valid email" appears.

### TC-06
**Title**: Email with multiple `@` signs shows validation error
**Priority**: Should Test
**Dimension**: Boundary
**Steps**:
1. Type `abc@def@xyz.com` into the email field.
2. Blur.

**Expected**: Error "Please enter a valid email" appears.

### TC-07
**Title**: Very long email exceeding RFC 5321 limit (254 characters)
**Priority**: Nice to Have
**Dimension**: Boundary
**Steps**:
1. Type a 300-character email into the field (e.g., `a`.repeat(290) + `@x.com`).
2. Blur.

**Expected**: Validation rejects. Exact error message depends on the implementation — acceptable messages are "Please enter a valid email" or a length-specific error.

---

## AC-3 — Duplicate email rejected

### TC-08
**Title**: Signup with email already in database shows duplicate error
**Priority**: Must Test
**Dimension**: Negative
**Preconditions**: An account with email `existing@example.com` exists in the database.
**Steps**:
1. Type `existing@example.com` into the email field.
2. Fill all other fields with otherwise-valid data.
3. Submit the form.

**Expected**: Form does not create a new account. Error "An account with this email already exists" is shown. Database user count is unchanged.

### TC-09
**Title**: Case-insensitive duplicate check
**Priority**: Must Test
**Dimension**: Boundary
**Preconditions**: An account with email `existing@example.com` exists.
**Steps**:
1. Type `EXISTING@EXAMPLE.COM` into the email field.
2. Submit.

**Expected**: Duplicate error shown. Email comparison is case-insensitive per RFC convention for the domain part and most providers' convention for the local part.

### TC-10
**Title**: Duplicate check hits the database, not a client-side cache
**Priority**: Should Test
**Dimension**: State
**Steps**:
1. Open the signup form in browser A. Type `new@example.com` but do not submit.
2. In browser B (or another tab), successfully create an account with `new@example.com`.
3. Return to browser A and submit the form.

**Expected**: Browser A's submission is rejected with the duplicate error. The check must hit the DB at submit time, not rely on cached state from page load.

---

## AC-4 — Validation triggers on blur and submit

### TC-11
**Title**: Invalid email shown on blur before any submit attempt
**Priority**: Must Test
**Dimension**: State transition
**Steps**:
1. Type `abc` into the email field.
2. Click out of the field (blur). Do not click Submit.

**Expected**: Error visible immediately.

### TC-12
**Title**: Fixing an invalid email clears the error on next blur
**Priority**: Must Test
**Dimension**: State transition
**Steps**:
1. Type `abc`, blur, confirm error is visible.
2. Return to the field, change value to `abc@xyz.com`, blur again.

**Expected**: Error disappears on the second blur. The field returns to its clean state.

---

## AC-5 — Valid email allows submission

### TC-13
**Title**: Happy path — valid email submits successfully
**Priority**: Must Test
**Dimension**: Happy
**Steps**:
1. Fill all required fields with valid data.
2. Type `user@example.com` in the email field.
3. Submit.

**Expected**: Account created. No error shown. User is redirected to the post-signup page (or whatever the success flow is per product).

### TC-14
**Title**: Email with plus-tag is accepted (e.g., `user+tag@example.com`)
**Priority**: Should Test
**Dimension**: Boundary
**Steps**:
1. Type `user+tag@example.com` into the field.
2. Submit.

**Expected**: Accepted as valid. RFC 5322 allows `+` in the local part, and blocking it is a common bug that prevents users from using per-service addressing.

### TC-15
**Title**: Email with subdomain is accepted (e.g., `user@mail.example.com`)
**Priority**: Nice to Have
**Dimension**: Boundary
**Steps**:
1. Type `user@mail.example.com` into the field.
2. Submit.

**Expected**: Accepted as valid.

---

## Out of scope

- **HTML5 `type="email"` vs custom JS validation** — the scenarios assume whatever mechanism the implementation chose will be observable to the user.
- **Internationalized domain names (IDN) and non-ASCII local parts** — rare in most products and usually a dedicated AC when it matters.
- **Rate limiting / CAPTCHA on submission** — not part of the AC under test.
- **Password field validation** — outside the scope of this ticket.
