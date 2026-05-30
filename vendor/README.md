This folder is reserved for bundled runtime tools used by SMART ReplySuite packages.

Recommended structure:

```text
vendor/
  node/
    darwin-arm64/bin/node
    darwin-x64/bin/node
    win32-x64/node.exe
  ocr/
    darwin-arm64/bin/pdftoppm
    darwin-arm64/bin/tesseract
    darwin-arm64/tessdata/deu.traineddata
    darwin-arm64/tessdata/eng.traineddata
    win32-x64/bin/pdftoppm.exe
    win32-x64/bin/tesseract.exe
    win32-x64/tessdata/deu.traineddata
    win32-x64/tessdata/eng.traineddata
```

The app first looks for these bundled tools and then falls back to environment variables or system paths.
