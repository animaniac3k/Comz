# Comz

Whisper is a standalone browser app for encoding and decoding private notes.

## Files

- `index.html` contains the page markup.
- `styles.css` contains the app styles.
- `script.js` contains the app behavior.

There are no third-party dependencies or build steps. Open `index.html` directly
or serve this folder with any static web server. Clipboard access works best on
HTTPS or localhost, as required by modern browsers.

## Install as an app

The app includes a web app manifest, install icons, and a service worker for
offline use. To enable installation, publish the files together on an HTTPS
host (or run them from `localhost` while developing); opening `index.html`
directly with a `file://` URL does not enable PWA installation or offline
caching.

- **Android:** Open the HTTPS site in Chrome and choose **Install app** or
  **Add to Home screen** from the browser menu.
- **iPhone/iPad:** Open the HTTPS site in Safari, tap **Share**, then choose
  **Add to Home Screen**.
