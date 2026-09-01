# 🚀 Publishing & Signing Releases Guide

This document walks you through generating signing keys, building signed releases, and publishing updates for **Leeflet** with automatic in-app updates.

---

## 📋 Table of Contents
1. [How the Updater Works](#1-how-the-updater-works)
2. [One-Time Setup: Generating Signing Keys](#2-one-time-setup-generating-signing-keys)
3. [Automated Publishing via GitHub Actions (Recommended)](#3-automated-publishing-via-github-actions-recommended)
4. [Manual Local Build & Signing](#4-manual-local-build--signing)
5. [How Users Receive Updates](#5-how-users-receive-updates)
6. [Troubleshooting & Gotchas](#6-troubleshooting--gotchas)

---

## 1. How the Updater Works

Leeflet uses **Tauri v2 Updater** and cryptographic **minisign** signatures:
1. When you publish a release on GitHub, Tauri produces an installer along with a cryptographic signature (`.sig`) and a manifest file named `latest.json`.
2. Installed copies of Leeflet query the `latest.json` endpoint on startup or when the user clicks **Check for Updates** in Settings.
3. When a newer version is found, Leeflet downloads the update bundle, verifies its signature against the embedded `pubkey`, installs it, and prompts the user to relaunch.

---

## 2. One-Time Setup: Generating Signing Keys

Tauri requires a private/public keypair so that only you can sign valid app updates.

### Step 2.1: Generate Keys
Run the following command in your terminal:
```bash
npx tauri signer generate -w ~/.tauri/leeflet.key
```

You will be prompted to enter a **password** to protect your private key. 
> 💡 *Note: You can leave the password blank by pressing Enter, or set a secure password.*

The command outputs two things:
1. **Public Key string** (e.g. `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6...`)
2. **Private Key file** saved to `~/.tauri/leeflet.key` (or `%USERPROFILE%\.tauri\leeflet.key` on Windows).

---

### Step 2.2: Add Public Key to `tauri.conf.json`
Open `src-tauri/tauri.conf.json` and paste your public key in the `plugins.updater.pubkey` field:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "PASTE_YOUR_PUBLIC_KEY_STRING_HERE",
      "endpoints": [
        "https://github.com/christliebdela/leeflet/releases/latest/download/latest.json"
      ]
    }
  }
}
```

Commit this change to your repository.

---

### Step 2.3: Add GitHub Repository Secrets
Go to your GitHub repository:
**`https://github.com/christliebdela/leeflet/settings/secrets/actions`**

Click **New repository secret** and add the following two secrets:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/leeflet.key` | Open the key file in Notepad/editor, copy the entire multi-line text, and paste it here. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Your passphrase | The password you chose in Step 2.1 (leave empty if you did not set one). |

---

## 3. Automated Publishing via GitHub Actions (Recommended)

The repository includes a ready-to-use GitHub Actions workflow at [`.github/workflows/release.yml`](.github/workflows/release.yml).

### Step-by-Step Release Process:

### 1. Bump the Version
When you are ready to ship a release (e.g., `0.2.0`), update the version number in two files:
1. `package.json`:
   ```json
   "version": "0.2.0"
   ```
2. `src-tauri/tauri.conf.json`:
   ```json
   "version": "0.2.0"
   ```

### 2. Commit and Tag
Commit the version bump and push a git tag:
```bash
git add package.json src-tauri/tauri.conf.json
git commit -m "chore: release v0.2.0"
git push origin main

# Create and push the version tag
git tag v0.2.0
git push origin v0.2.0
```

### 3. GitHub Actions Builds & Publishes
Once the tag is pushed, GitHub Actions automatically:
- **Windows (`windows-latest`)**: Compiles `.exe` NSIS installer, `.msi`, and update zip/sig.
- **macOS (`macos-latest`)**: Compiles `.dmg` disk image and `.app` bundles for both Apple Silicon (`aarch64`) and Intel (`x86_64`).
- **Linux (`ubuntu-22.04`)**: Compiles `.AppImage` and `.deb` packages.
- Signs all update packages with your private key.
- Generates `latest.json` containing the version, release notes, and minisign signatures.
- Creates a new GitHub Release with all platform installer assets and `latest.json` attached.

---

## 4. Manual Local Build & Signing

If you ever want to build and sign release packages on your local machine without GitHub Actions:

### On Windows PowerShell:
```powershell
# Set environment variables for signing
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\leeflet.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your_key_password_if_any"

# Build production bundle
npm run tauri build
```

The compiled and signed binaries will be placed in:
`src-tauri/target/release/bundle/nsis/`

The output includes:
- `leeflet_x.y.z_x64-setup.exe` (Standalone Windows NSIS installer)
- `leeflet_x.y.z_x64-setup.nsis.zip` (Update bundle archive)
- `leeflet_x.y.z_x64-setup.nsis.zip.sig` (Minisign signature file)
- `latest.json` (Update manifest to upload to your release)

---

## 5. How Users Receive Updates

1. **Automatic Background Check**:
   - Whenever Leeflet opens, it quietly checks GitHub for a new `latest.json` in the background after 2.5 seconds.
2. **Sidebar Badge Indicator**:
   - When an update is detected, an **Update Ready v...** badge appears in the bottom sidebar.
3. **One-Click Update**:
   - Clicking the badge opens the **Update Modal** showing the release notes.
   - Clicking **Download & Install** downloads the update with live progress.
   - Clicking **Restart & Apply** seamlessly relaunches the app on the new version.
4. **Manual Checking in Settings**:
   - Users can go to **Settings → About** and click **Check for Updates** anytime.

---

## 6. Troubleshooting & Gotchas

### Issue: "missing field `pubkey`" panic
* **Cause**: `src-tauri/tauri.conf.json` is missing the `plugins.updater.pubkey` field.
* **Fix**: Ensure the `pubkey` field is present under `plugins.updater` as shown in Step 2.2.

### Issue: Updater says "You are on the latest version" in local development
* **Cause**: In local development (`npm run tauri dev`), the local version matches or is higher than any remote tag, or no remote release has been tagged yet.
* **Fix**: To preview and test the update modal UI at any time, go to **Settings → About** and click the **Preview Dialog** link.

### Issue: "Signature verification failed"
* **Cause**: The private key used during GitHub Actions build does not match the `pubkey` in `tauri.conf.json`.
* **Fix**: Ensure `TAURI_SIGNING_PRIVATE_KEY` in GitHub Secrets was generated alongside the `pubkey` in `tauri.conf.json`.
