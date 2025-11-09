#!/usr/bin/env python3
import re
from pathlib import Path

patterns = [
    (re.compile(r'\.\./css/'), 'static/css/'),
    (re.compile(r'\.\./javaScript/', re.IGNORECASE), 'static/js/'),
    (re.compile(r'/javaScript/', re.IGNORECASE), '/static/js/'),
    (re.compile(r'src="img/'), 'src="static/img/'),
    (re.compile(r'href="img/'), 'href="static/img/'),
    (re.compile(r"src='img/"), "src='static/img/"),
    (re.compile(r"href='img/"), "href='static/img/"),
    (re.compile(r'href="templates/'), 'href="'),
    (re.compile(r"href='templates/"), "href='"),
    (re.compile(r'src="templates/'), 'src="'),
    (re.compile(r"src='templates/"), "src='"),
    (re.compile(r'\.\./templates/'), '../'),
    (re.compile(r'/templates/'), '/'),
]

root = Path('.')
for file in root.rglob('*.html'):
    try:
        text = file.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        print("Skip (encoding):", file)
        continue
    new_text = text
    for pat, rep in patterns:
        new_text = pat.sub(rep, new_text)
    if new_text != text:
        file.write_text(new_text, encoding='utf-8')
        print("Updated:", file)