import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AUTH_MESSAGES,
  getSignupPasswordError,
  mapLoginError,
  mapPasswordUpdateError,
  mapSignupError,
} from "./messages.ts";

test("rejects passwords shorter than 6 characters", () => {
  assert.equal(getSignupPasswordError("12345"), AUTH_MESSAGES.passwordTooShort);
});

test("accepts passwords with at least 6 characters", () => {
  assert.equal(getSignupPasswordError("123456"), null);
});

test("maps weak_password code to a password length message", () => {
  assert.equal(
    mapSignupError({ code: "weak_password", message: "Password should be at least 6 characters." }),
    AUTH_MESSAGES.passwordTooShort,
  );
});

test("maps Password should be at least 6 characters without a code", () => {
  assert.equal(
    mapSignupError({ message: "Password should be at least 6 characters" }),
    AUTH_MESSAGES.passwordTooShort,
  );
});

test("maps already registered emails to a specific message", () => {
  assert.equal(
    mapSignupError({ code: "user_already_exists", message: "User already registered" }),
    AUTH_MESSAGES.emailAlreadyRegistered,
  );
  assert.equal(mapSignupError({ message: "User already registered" }), AUTH_MESSAGES.emailAlreadyRegistered);
});

test("maps invalid email errors", () => {
  assert.equal(
    mapSignupError({ code: "email_address_invalid", message: "Unable to validate email address: invalid format" }),
    AUTH_MESSAGES.invalidEmail,
  );
});

test("keeps a generic fallback for unknown signup errors", () => {
  assert.equal(mapSignupError({ message: "Database error saving new user" }), AUTH_MESSAGES.signupFailed);
  assert.equal(mapSignupError(null), AUTH_MESSAGES.signupFailed);
});

test("maps invalid login credentials", () => {
  assert.equal(
    mapLoginError({ code: "invalid_credentials", message: "Invalid login credentials" }),
    AUTH_MESSAGES.invalidCredentials,
  );
});

test("maps unconfirmed email on login", () => {
  assert.equal(
    mapLoginError({ code: "email_not_confirmed", message: "Email not confirmed" }),
    AUTH_MESSAGES.emailNotConfirmed,
  );
});

test("maps password update errors without leaking supabase copy", () => {
  assert.equal(
    mapPasswordUpdateError({ code: "weak_password", message: "Password should be at least 6 characters." }),
    AUTH_MESSAGES.passwordTooShort,
  );
  assert.equal(mapPasswordUpdateError({ code: "same_password" }), AUTH_MESSAGES.passwordSameAsCurrent);
  assert.equal(
    mapPasswordUpdateError({ name: "AuthSessionMissingError", message: "Auth session missing!" }),
    AUTH_MESSAGES.sessionExpired,
  );
  assert.equal(
    mapPasswordUpdateError({ message: "Database error updating user" }),
    AUTH_MESSAGES.passwordUpdateFailed,
  );
});
