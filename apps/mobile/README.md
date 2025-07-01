This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Environment Setup

### Mobile App Environment Configuration

Before running the mobile app, you need to set up the environment configuration:

```sh
# From the monorepo root
pnpm mobile:setup-env

# OR from the mobile app directory
cd apps/mobile
pnpm setup-env
```

This will create a `.env` file from `.env.example` with the default configuration:
- `CONVEX_URL=http://localhost:3210` - Points to your local Convex backend
- Additional mobile app configuration options

**Environment Files:**
- `.env.example` - Template with default values (tracked in git)
- `.env` - Your local configuration (ignored by git)
- Edit `.env` to customize settings for your development environment

**Note:** The `.env` file is automatically ignored by git to prevent committing sensitive configuration.

### iOS Setup (Required for iOS development)

Before running the iOS app for the first time, you need to install CocoaPods dependencies. Choose one of the setup methods below:

> **Note**: If you encounter permission errors when running the setup scripts, make them executable first:
> ```sh
> chmod +x apps/mobile/scripts/setup-ios.sh
> chmod +x apps/mobile/scripts/setup-ios-system.sh
> ```

#### Method 1: Bundle-based Setup (Recommended)
```sh
# From the monorepo root
pnpm mobile:setup-ios

# OR from the mobile app directory
cd apps/mobile
pnpm setup-ios
```

#### Method 2: System Ruby Setup (If Ruby version issues)
```sh
# From the monorepo root
pnpm mobile:setup-ios-system

# OR from the mobile app directory
cd apps/mobile
pnpm setup-ios-system
```

**Ruby Version Management:**
- The project requires Ruby 3.4.2 (specified in `.ruby-version`)
- Ruby 3.4.2 requires additional dependencies (bigdecimal) which are automatically handled by the setup scripts
- If you have Ruby version conflicts, use Method 2 or install the correct Ruby version:
  - **rbenv**: `rbenv install 3.4.2 && rbenv local 3.4.2`
  - **rvm**: `rvm install 3.4.2 && rvm use 3.4.2`

**Troubleshooting Ruby 3.4.2 Issues:**
- If you encounter `cannot load such file -- bigdecimal` errors, the setup scripts will automatically handle this
- The scripts will regenerate `Gemfile.lock` for Ruby 3.4.2 compatibility
- For manual fixes: `gem install bigdecimal` or `sudo gem install bigdecimal`

> **Note**: You only need to run this once after cloning the repository, or after updating native dependencies.

## Step 1: Start Metro

First, you will need to run **Metro** (server) the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

Make sure you've completed the iOS setup (see Initial Setup section above) before running:

```sh
# From monorepo root
pnpm mobile:ios

# OR from mobile app directory
pnpm ios
```

If you encounter build issues, try:
1. Clean and reinstall pods: `pnpm uninstall-pods && pnpm setup-ios`
2. Reset Metro cache: `pnpm start --reset-cache`
3. Clean Xcode build folder (Product → Clean Build Folder in Xcode)

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.






If you want to install it globally via npm, you can use:
```npm install -g ios-deploy```


You can list all available iOS simulators using:
```xcrun simctl list devices```

### Easy way to change Ruby version in Mac, M1, M2, and M3
https://dev.to/luizgadao/easy-way-to-change-ruby-version-in-mac-m1-m2-and-m3-16hl
```

## File Management & Git Ignore

### Automatically Ignored Files

The following mobile app files are automatically ignored by git (configured in root `.gitignore`):

**Environment & Configuration:**
- `apps/mobile/.env` - Local environment configuration
- `apps/mobile/.env.local` - Local environment overrides

**iOS Dependencies & Build:**
- `apps/mobile/ios/Pods/` - CocoaPods dependencies
- `apps/mobile/ios/.xcode.env.local` - Local Xcode environment
- `apps/mobile/ios/build/` - iOS build artifacts
- `apps/mobile/ios/DerivedData/` - Xcode derived data

**Ruby Dependencies:**
- `apps/mobile/vendor/bundle/` - Bundler gems
- `apps/mobile/.bundle/` - Bundle configuration

**Android Build:**
- `apps/mobile/android/app/build/` - Android app build
- `apps/mobile/android/build/` - Android project build
- `apps/mobile/android/.gradle/` - Gradle cache

### What's Tracked in Git

**Configuration Templates:**
- `.env.example` - Environment template
- `Gemfile` & `Gemfile.lock` - Ruby dependencies
- `package.json` - Node.js dependencies

**iOS Configuration:**
- `Podfile` - CocoaPods configuration
- `Podfile.lock` - Locked CocoaPods versions
- `.xcode.env` - Xcode environment template

**Scripts:**
- `scripts/setup-ios.sh` - iOS setup script
- `scripts/setup-ios-system.sh` - Alternative iOS setup
- `scripts/setup-env.sh` - Environment setup script