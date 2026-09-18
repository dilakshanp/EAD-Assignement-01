Every time you want to test the Android app, do this checklist.

**1. Start Emulator**

```bash
emulator -avd Medium_Phone_API_35
```

Leave that terminal open.

**2. Confirm Device**

In a new terminal:

```bash
adb devices
```

Expected:

```text
emulator-5554    device
```

**3. Start Backend API**

In another terminal:

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/backend-api"
dotnet run --urls "http://0.0.0.0:5088"
```

Leave it running.

**4. Build Android APK**

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/android-app"
./gradlew assembleDebug
```

**5. Install APK**

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**6. Open App**

```bash
adb shell monkey -p com.sliit.solarmicrogrid 1
```

**Important**

If `adb` or `emulator` says command not found, run this first:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Better permanent fix:

```bash
echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then future terminals should work normally.
