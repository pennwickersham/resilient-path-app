# Security cleanup

This repository is public. Until the `10-31-26-updates` branch, it carried three things
that must never be committed:

- `android/app/resilient-path-release.keystore` and `android/resilient-path-release.keystore`:
  the Android release signing key.
- The keystore and key passwords, written into `android/app/build.gradle`.
- `screenshots/.edge-screenshot-profile/`: a full Microsoft Edge browser profile, including
  its `Login Data` (saved passwords) and `Cookies` databases.

They are removed from the current tree, and `.gitignore` now keeps them out. **They are still in
the git history and anyone may already have copied them**, so treat all three as exposed.

## Before you pull this change

Pulling a commit that deletes a tracked file deletes it from your disk. **Copy
`android/app/resilient-path-release.keystore` somewhere safe outside the repo first.**

## Signing release builds now

1. Copy `android/keystore.properties.example` to `android/keystore.properties` (git-ignored).
2. Fill in `storePassword` and `keyPassword`, and point `storeFile` at your keystore (relative
   to `android/app/`). Keep the keystore itself outside the repo or git-ignored.

CI can set `TRP_KEYSTORE_FILE`, `TRP_KEYSTORE_PASSWORD`, `TRP_KEY_ALIAS` and `TRP_KEY_PASSWORD`
instead. Without either, release builds come out unsigned rather than failing.

## What still has to be done

1. **Replace the upload key.** The key and its password are public, so anyone can sign an APK as
   this app. If the app uses Play App Signing, request an upload key reset in Play Console
   (Setup → App signing), generate a new keystore with a new password, and use it from then on.
2. **Browser profile.** Whoever used that Edge profile should change the password of every site
   they signed into with it and sign out of those sites' active sessions.
3. **Purge the history.** Removing the files from the latest commit does not remove them from
   GitHub. Rewriting history (for example `git filter-repo --invert-paths --path
   screenshots/.edge-screenshot-profile --path android/app/resilient-path-release.keystore
   --path android/resilient-path-release.keystore`, plus replacing the password text) needs a
   force-push to every branch, and every existing clone must be re-cloned afterwards. Do this only
   after step 1, since the old key stays usable to anyone who already copied it.
