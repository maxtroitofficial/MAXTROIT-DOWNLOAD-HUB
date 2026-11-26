# MAXTROIT DOWNLOAD HUB

Mobile-first download website with separate public and admin panels, backed by Firebase Authentication and Cloud Firestore.

## Panels
- Public website: `index.html` — live downloads, local search, category filtering and download details.
- Admin panel: `admin.html` — Firebase email/password login with an allow-listed administrator UID.
- Download details: `download.html?id=DOCUMENT_ID`.

## Firebase setup
1. Enable **Authentication → Sign-in method → Email/Password**.
2. Create the administrator account in Firebase Authentication.
3. Create a Cloud Firestore database.
4. Set the Firebase web app values and administrator UID in `firebase-config.js`.
5. Publish `firestore.rules` in the Firebase Console.
6. Deploy the static site over HTTPS.

The Firebase web configuration is intended for frontend use. Never commit service-account JSON, private keys, passwords, or access tokens.

## Firestore data model
Collection: `downloads`. Documents use `title`, `description`, `category`, `thumbnail`, `url`, and optionally `created`.

The website and admin panel read the collection without requiring the optional `created` field, then sort locally. Existing records without that field remain visible. Editing an old record may add a `created` timestamp to that record; no bulk migration is performed.

Collection: `siteConfig`, document `public`. This stores public brand text and optional logo/banner image data.

## Image handling
New gallery images are resized before being stored in Firestore document fields. Logos preserve transparency using WebP where supported, with PNG fallback. New thumbnails are resized to a maximum 600 px edge and use WebP where supported. Existing image data remains readable. Image data is subject to Firestore document size limits.

## Admin security
Firestore rules allow public reads of downloads and the public site settings document. Only the configured authenticated administrator UID can write. The rules—not the client-side UID check—are the security boundary. Keep the UID in `firebase-config.js` and `firestore.rules` aligned.

## Operational notes
- Admin save/delete success is reported separately from a subsequent list refresh failure.
- Requests have a timeout message. If a write times out, its final server-side result may be uncertain; check the list before retrying.
- The dashboard reports whether its Firestore read succeeded; it does not claim that the public website is externally reachable.
- Browser/device testing and Firebase Console configuration must be verified in the target environment before deployment.

## Website Builder

The admin panel includes an advanced Website Builder workspace. It supports:
- Importing the existing homepage layout (the downloads collection remains managed by the existing app).
- Nested content blocks, selection, layer reordering, duplicate/delete, and responsive desktop/tablet/mobile styles.
- Draft autosave to Firestore, publish snapshots, and version restore.
- Image uploads to the restricted `builder-media` Storage path.
- Published homepage snapshots are stored separately in `sites/maxtroit/publicPages/home`; public clients can read published snapshots without receiving private draft documents.

Open `admin.html`, sign in with the configured administrator account, then choose **Website Builder**. The builder's imported layout should be reviewed on desktop and mobile before publishing. Existing downloads, music, social links, Flash Screen and admin workflows remain separate.

## Builder data and limitations

- Draft pages: `sites/maxtroit/pages/{pageId}` (administrator-only).
- Version snapshots: `sites/maxtroit/versions/{versionId}` (administrator-only).
- Public snapshots: `sites/maxtroit/publicPages/{pageId}` (public read; administrator write).
- The current public-site bridge renders the published `home` page above the existing downloads collection. Additional page routing, full offline conflict resolution, richer media library management and browser/device end-to-end testing remain future work.

## Creating an independent fork

A fork is not ready to deploy immediately: the checked-in Firebase configuration and Hosting target belong to the original project. Create your own Firebase project, admin account, Firestore/Storage setup, and Hosting site first. Follow [FORK-SETUP-GUIDE.md](FORK-SETUP-GUIDE.md), then run `node scripts/fork-preflight.mjs` before deployment. Never deploy this repository while it still targets the original `maxtroit-download-hub` project or `d-hub` Hosting site.
