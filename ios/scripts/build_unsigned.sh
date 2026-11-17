#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v xcodegen >/dev/null || { echo 'Install XcodeGen first: brew install xcodegen'; exit 1; }
python3 scripts/prepare_resources.py
xcodegen generate
xcodebuild -project TimeCasket.xcodeproj -scheme TimeCasket -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$PWD/build/TimeCasket.xcarchive" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO archive
mkdir -p build/package/Payload
ditto build/TimeCasket.xcarchive/Products/Applications/TimeCasket.app build/package/Payload/TimeCasket.app
(cd build/package && /usr/bin/zip -qry ../time-casket-ios-0.1.27-alpha.1-unsigned.ipa Payload)
echo 'Created build/time-casket-ios-0.1.27-alpha.1-unsigned.ipa (sign before installing)'
