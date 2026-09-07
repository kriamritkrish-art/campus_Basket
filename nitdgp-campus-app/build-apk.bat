@echo off
echo ===================================================
echo   Campus Basket - NIT Durgapur APK Builder
echo ===================================================
set "JAVA_HOME=C:\Users\SOURAV SENAPATI\jdk-17.0.12+7"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo 1. Building web application...
call npm run build

echo 2. Syncing Capacitor assets...
call npx cap sync android

echo 3. Compiling Android APK with Gradle...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "CampusBasket.apk"
    echo ===================================================
    echo   SUCCESS! APK generated at: nitdgp-campus-app\CampusBasket.apk
    echo ===================================================
) else (
    echo Build completed. Check android\app\build\outputs\apk\
)
