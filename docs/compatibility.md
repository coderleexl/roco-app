# Compatibility gates

Build and fixture results must come from the matching GitHub commit/run, not from the existence of this source code. Current live results: [Actions](https://github.com/coderleexl/roco-app/actions/workflows/android.yml).

| Gate | Status / evidence needed |
|---|---|
| GitHub APK build / lint / unit tests | Pending successful Actions run |
| Ruffle installed and original fixture executes ActionScript | Pending emulator smoke |
| Associated popup opener, shared cookie and close callback | Pending emulator smoke |
| Fixture cookie survives process restart | Pending two separate instrumentation runs |
| Complete official game page | Not verified on prototype |
| User authenticates and game receives valid login | Not verified |
| Server list and selection | Not verified |
| Map, character, resources | Not verified |
| Movement, interface and one basic battle | Not verified |
| 15-minute stability | Not verified |
| Official session recovery / re-login after restart | Not verified; fixture cookies do not prove game authentication |

No game compatibility scripts are currently installed. Ruffle's complete upstream Firefox extension is used; packaged APIs and runtime behavior are validated by installation and Flash smoke tests, not assumed from Firefox support.
