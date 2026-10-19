# Google sign-in for existing members

Status: researched integration design; not enabled. Existing passwords and two-factor authentication remain available. Do not show a nonfunctional Google sign-in button.

## Lowest-maintenance option

Recommend **Firebase Authentication with its Google provider**. Enable Google in the Firebase console and authorize the panel domain. Firebase handles the browser flow and managed provider configuration; an organization-owned Firebase/Google Cloud project, support email, and domain setup are still required. This reduces manual OAuth credential administration, not all provider administration.

[Firebase setup](https://firebase.google.com/docs/auth/web/google-signin) documents enabling Google and using its browser SDK. In contrast, [Clerk's Google connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) requires custom OAuth credentials for production; its shared credentials are a development convenience. Auth proxies alone would add a second login unless the panel also integrates their verified identities.

For this PHP application, direct Google OAuth via a maintained library is the smallest technical integration, but requires managing one client ID/secret and consent configuration. Firebase is the recommendation when reducing that administrative burden is more important than minimizing dependencies.

## Existing-account migration

1. Add a Connect Google action to the authenticated account page, protected by recent password/2FA verification and CSRF protection.
2. Complete Google sign-in through Firebase; verify the Firebase ID token on the server using a maintained verifier. Require the configured project audience/issuer, valid signature/expiry, verified email, and Google sign-in provider. Never trust an email from browser JSON.
3. Bind the provider's immutable project/subject identity to the current panel user with uniqueness constraints. Do not automatically merge on email alone, especially for administrator accounts or third-party Google-account email addresses.
4. On later Google sign-in, look up the existing binding and invoke the panel's normal login/2FA completion pipeline. Preserve server ownership, subuser permissions, API keys, and audit history. Rotate the session on login.
5. Members who cannot use passwords can recover the existing account first or complete an administrator-reviewed linking process. A Google identity alone must not create a privileged account or bypass a suspended/deleted account.
6. Keep a tested password/2FA administrator recovery path. Disconnect/relink requires recent authentication; audit these changes. Do not silently disable existing 2FA.

No password database export to Firebase is needed. The panel retains authorization; Firebase supplies identity proof. Avoid service-account credentials if the chosen verifier can validate project ID tokens with public certificates; if administrative SDK features need credentials, store them only in the deployment secret store.

## Needed before implementation/activation

Choose the organization-owned project, enable the provider and authorized domain, supply its public web configuration, and verify a member and administrator linking/sign-in cycle. No private OAuth or service-account key belongs in this repository. Domain/Google login may require the project owner's interactive browser session.
