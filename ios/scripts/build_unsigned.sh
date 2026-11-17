#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v xcodegen >/dev/null || { echo 'Install XcodeGen first: brew install xcodegen'; exit 1; }
python3 scripts/prepare_resources.py
xcodegen generate
plutil -lint Info.plist
xcodebuild -project TimeCasket.xcodeproj -scheme TimeCasket -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath "$PWD/build/DerivedData" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO INFOPLIST_EXPAND_BUILD_SETTINGS=YES build
python3 - <<'CHECK'
import pathlib, plistlib
app=pathlib.Path('build/DerivedData/Build/Products/Release-iphoneos/TimeCasket.app')
info=plistlib.loads((app/'Info.plist').read_bytes())
assert info.get('CFBundleIdentifier') == 'io.github.coderleexl.rocoapp', info
assert info.get('CFBundleExecutable') == 'TimeCasket', info
assert info.get('CFBundlePackageType') == 'APPL', info
assert (app/info['CFBundleExecutable']).is_file()
print('Verified device app metadata:', info['CFBundleIdentifier'])
CHECK
mkdir -p build/package/Payload
ditto build/DerivedData/Build/Products/Release-iphoneos/TimeCasket.app build/package/Payload/TimeCasket.app
(cd build/package && /usr/bin/zip -qry ../time-casket-ios-0.1.27-alpha.1-unsigned.ipa Payload)
echo 'Created build/time-casket-ios-0.1.27-alpha.1-unsigned.ipa (sign before installing)'
