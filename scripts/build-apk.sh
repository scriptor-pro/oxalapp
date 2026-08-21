#!/usr/bin/env bash
# Builds the debug APK: web build -> capacitor sync -> gradle assembleDebug.
#
# Capacitor Android's generated Gradle modules require Java 21, but Debian
# 12 only ships Java 17 in its repos. If no system JDK 21 is found, this
# downloads Eclipse Temurin 21 into ~/.jdks/ (no sudo, no system changes)
# and points Gradle at it via JAVA_HOME for this build only.
#
# Usage: scripts/build-apk.sh [--install]
#   --install   also install the resulting APK on a connected device via adb

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JDKS_DIR="$HOME/.jdks"
TEMURIN_21_URL="https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse"

find_java21_home() {
  if [ -n "${JAVA21_HOME:-}" ] && "$JAVA21_HOME/bin/java" -version 2>&1 | grep -q '"21'; then
    echo "$JAVA21_HOME"
    return
  fi
  if [ -d "$JDKS_DIR" ]; then
    for dir in "$JDKS_DIR"/jdk-21*; do
      if [ -x "$dir/bin/javac" ]; then
        echo "$dir"
        return
      fi
    done
  fi
}

ensure_java21() {
  local home
  home="$(find_java21_home)"
  if [ -n "$home" ]; then
    echo "Using JDK 21 at $home"
    JAVA_HOME="$home"
    return
  fi

  echo "No JDK 21 found — downloading Eclipse Temurin 21 into $JDKS_DIR (no sudo required)..."
  mkdir -p "$JDKS_DIR"
  local archive
  archive="$(mktemp --suffix=.tar.gz)"
  curl -Ls "$TEMURIN_21_URL" -o "$archive"
  tar -xzf "$archive" -C "$JDKS_DIR"
  rm -f "$archive"

  home="$(find_java21_home)"
  if [ -z "$home" ]; then
    echo "Failed to locate a usable JDK 21 after extraction." >&2
    exit 1
  fi
  echo "Installed JDK 21 at $home"
  JAVA_HOME="$home"
}

cd "$REPO_ROOT"

echo "==> Building web bundle"
npm run build

echo "==> Syncing Capacitor Android project"
npx cap sync android

ensure_java21
export JAVA_HOME

echo "==> Building debug APK (JAVA_HOME=$JAVA_HOME)"
(cd android && ./gradlew assembleDebug)

APK_PATH="$REPO_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
echo "==> APK built: $APK_PATH"

if [ "${1:-}" = "--install" ]; then
  echo "==> Installing on connected device"
  adb install -r "$APK_PATH"
fi
