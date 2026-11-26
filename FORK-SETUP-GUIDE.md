# Create Your Own MAXTROIT Download Hub

This guide is for creating an independent copy of MAXTROIT DOWNLOAD HUB. It is intentionally separate from the original live website.

## Important: what is and is not automatic

- Copying this repository does **not** automatically create a Firebase project or publish a website.
- Each owner must use their own GitHub repository, Firebase project, Firebase web app, Authentication user, Firestore database, Storage bucket, and Hosting site.
- The fork template now starts with placeholder Firebase values and rules that deny writes until you set your own admin UID. Never connect a fork to the original `maxtroit-download-hub` Firebase project or the original `d-hub` Hosting site.
- Do not paste passwords, service-account JSON, private keys, access tokens, or recovery codes into ChatGPT or GitHub.
- The browser Firebase web config is not a password. Security must be enforced by Firestore and Storage Rules and Firebase Authentication.

## Before starting

You need:
1. Your own GitHub account.
2. Your own Google account with access to Firebase.
3. Node.js installed on your computer.
4. Firebase CLI installed with `npm install -g firebase-tools`.
5. A separate repository created from this project using GitHub's **Use this template** (recommended) or **Fork** option.

## Step 1 — Create your own code copy

1. Open the MAXTROIT DOWNLOAD HUB GitHub repository.
2. Choose **Use this template** (if enabled) to create a new repository under your account. Otherwise choose **Fork**.
3. Give your repository a new name, for example `my-download-hub`.
4. Work only in your new repository. Do not edit the original MAXTROIT repository.
5. In your own repository, open **Settings → Secrets and variables → Actions** only if you later configure deployment automation. Never add secrets to source files.

## Step 2 — Create your own Firebase project

1. Open https://console.firebase.google.com/ and select **Add project**.
2. Choose a project name that belongs to you. Do not select `maxtroit-download-hub`.
3. In Project settings, add a **Web app** and copy its Firebase web configuration.
4. In **Authentication → Sign-in method**, enable **Email/Password**.
5. In **Authentication → Users**, create your own administrator account. Use an email and a strong unique password that you do not share.
6. Open **Firestore Database** and create the database in the region you choose.
7. Open **Storage** and initialize your own Storage bucket.

## Step 3 — Connect your fork to your Firebase project

1. In your own GitHub repository, open `firebase-config.js`.
2. Replace every `YOUR_FIREBASE_...` placeholder in the config with values from your own Firebase Web App.
3. Set `window.ADMIN_UID` to the UID of the administrator account you created in your own Firebase Authentication users list.
4. Do not use the original project's administrator UID.
5. Save and commit the change in your own repository.

The Firebase web config is intended to be present in a browser app. It is not an admin password. Never put a service-account private key in `firebase-config.js`.

## Step 4 — Set up security rules

1. Open your fork's `firestore.rules`.
2. Replace `YOUR_FIREBASE_ADMIN_UID` in the `isAdmin()` function with the UID from your own Firebase Authentication user.
3. Open your fork's `storage.rules`.
4. Replace `YOUR_FIREBASE_ADMIN_UID` in its `isAdmin()` function with the same UID.
5. Review the rules before publishing. They must not contain the original project's administrator UID.
6. In Firebase Console, publish the contents of your own `firestore.rules` under Firestore → Rules and your own `storage.rules` under Storage → Rules.

**Do not loosen rules to make errors disappear.** If a feature is denied, inspect the required access and update rules deliberately.

## Step 5 — Point Firebase CLI at your own project

From a terminal opened in your own repository folder:

```bash
firebase login
firebase projects:list
firebase use --add
```

When prompted, select the Firebase project you created in Step 2 and give it an alias such as `default`.

Check `.firebaserc` and confirm that it names your own project ID, not `maxtroit-download-hub`. This file is local to your clone and should not be committed with personal project settings.

## Step 6 — Choose a unique Hosting site

The repository's original `firebase.json` may contain the original Hosting site name. Do not deploy while it still targets `d-hub`.

Create a Hosting site for your own project in Firebase Console (Hosting → Get started / Add another site), then replace `YOUR_FIREBASE_HOSTING_SITE_ID` in `firebase.json` with your new Hosting site ID.

Verify all three values before deployment:
- `.firebaserc` → your Firebase project ID
- `firebase.json` → your Hosting site ID
- `firebase-config.js` → your Firebase web app config and your admin UID

They must all belong to your own project.

## Step 7 — Test before publishing

1. Run `firebase use` and verify it shows your own project.
2. Check the project ID and Hosting site ID again.
3. Run the repository preflight check:

```bash
node scripts/fork-preflight.mjs
```

The check blocks known original Firebase API key, project ID, Auth domain, Storage bucket, sender ID, app ID, Hosting site, and admin UID references, and catches mismatched project/admin values. It is a guardrail, not proof that you own the Firebase project or Hosting site. Confirm ownership in Firebase Console.
4. Deploy only after confirming both the project and Hosting site are yours:

```bash
firebase deploy
```

5. Open your own Hosting URL.
6. Sign in to your own Admin Panel using the Firebase Authentication account you created.
7. Add a harmless test banner or test download, then verify it appears only on your own website.
8. Check the original MAXTROIT website separately. It must remain unchanged.

If anything points to `maxtroit-download-hub` or `d-hub`, stop and correct it before deployment.

## Step 8 — Future changes

Make future edits in your own repository and deploy to your own Hosting site. Changes made in your fork do not update the original MAXTROIT website. Updates from the original repository do not automatically overwrite your copy.

## Using ChatGPT to help with setup

You can connect ChatGPT to GitHub using ChatGPT's **Settings → Apps** area (the label and available connectors may vary by account) and authorize access only to the repository you want help with.

Then ask ChatGPT:

> Help me set up my own independent MAXTROIT DOWNLOAD HUB fork. First inspect my fork and make a checklist. Do not edit or deploy anything until I approve. My Firebase project and Hosting site must be my own, never the original MAXTROIT project. Guide me step by step. Do not ask me to paste passwords, private keys, service-account files, access tokens, or recovery codes. Before any deployment, verify the project ID, Hosting site ID, Firebase config, administrator UID, Firestore rules, and Storage rules. Stop if any value points to the original project.

ChatGPT can inspect and help edit files in the connected GitHub repository when the required connector permissions are available. It cannot safely guess your Firebase project values, create accounts on your behalf without the required authorization, or prove a deployment is correct without checking the Firebase Console and live site. You must complete account sign-in, grant permissions, and approve any requested changes or deployments.

## Troubleshooting checklist

- **Admin login fails:** confirm Email/Password is enabled, the admin user exists in your Firebase Authentication users list, and `window.ADMIN_UID` matches that user's UID.
- **Permission denied:** confirm the UID in both Firestore and Storage Rules matches your own authenticated UID, then publish the rules to your own Firebase project.
- **Data does not appear:** confirm `firebase-config.js` points to your own project and the database was created there.
- **Wrong website gets deployed:** stop. Check `.firebaserc` and `firebase.json`; never deploy if they point to the original project/site.

## Independence checklist

Before calling your fork independent, all must be true:

- [ ] Separate GitHub repository
- [ ] Separate Firebase project
- [ ] Separate Firebase Authentication admin account
- [ ] Own administrator UID in config and both rule files
- [ ] Separate Firestore database and rules
- [ ] Separate Storage bucket and rules
- [ ] Separate Firebase Hosting site
- [ ] Test changes appear only on the fork website
- [ ] Original MAXTROIT website and admin panel remain unchanged

## Install the Admin Panel on Android

After your own website is deployed over HTTPS and the Admin Panel works:

1. Open your own `/admin.html` URL in Chrome on Android.
2. Open Chrome's menu and choose **Install app** or **Add to Home screen** (the wording varies by device).
3. Confirm the install. The shortcut opens your own Admin Panel in an app-style window.
4. Sign in using your own Firebase admin account.

This is an installable PWA shortcut. The repository also contains a universal Android WebView wrapper under `android-admin/`. Its GitHub Actions workflow builds a debug APK artifact; open the Actions tab, select **Build universal Admin APK**, and download the `download-hub-admin-debug-apk` artifact after a successful run. Debug APK is for testing/sideloading, not a Play Store release.

## Admin Panel APK status

This repository currently provides the Admin Panel as the HTTPS page `/admin.html`. The existing `manifest.json` is for the public Download Hub, not an Android Admin APK. No signed Admin Panel APK is included in this fork template yet. Do not treat the public PWA manifest as an Admin APK. A universal Android wrapper still needs a separate Android build, a strict HTTPS website allowlist, safe URL validation, app signing, and device testing before an APK can be distributed. Never embed Firebase service-account credentials or admin passwords in an APK.
