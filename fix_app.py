import re

with open('public/app.js', 'r') as f:
    app_js = f.read()

# Map old IDs to new IDs
app_js = app_js.replace("document.getElementById('downloadForm')", "document.body") # Form not used, we'll intercept button click instead
app_js = app_js.replace("document.getElementById('urlInput')", "document.getElementById('url-field')")
app_js = app_js.replace("document.getElementById('submitBtn')", "document.getElementById('extract-cta')")
app_js = app_js.replace("document.getElementById('pasteBtn')", "document.getElementById('paste-btn')")
app_js = app_js.replace("document.getElementById('resultCard')", "document.querySelector('section:has(> div > img)')") # The result card section
app_js = app_js.replace("document.getElementById('videoTitle')", "document.querySelector('h2.font-headline-sm')")
app_js = app_js.replace("document.getElementById('downloadLink')", "document.getElementById('save-device-btn')")
app_js = app_js.replace("document.getElementById('thumbImg')", "document.querySelector('section:has(> div > img) img')")

# Remove some old UI logic that conflicts
# We'll adapt it later manually if needed.

with open('public/app.js', 'w') as f:
    f.write(app_js)

