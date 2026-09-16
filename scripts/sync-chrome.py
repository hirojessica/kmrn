"""Synchronize shared static chrome without requiring JavaScript to render navigation."""
from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
sections = {
    'header': r'<header class="lr-header">.*?</header>',
    'footer': r'<footer class="lr-footer">.*?</footer>',
    'menu': r'<dialog id="mobile-menu".*?</dialog>',
}
for name in ['index', 'collection', 'product', 'about', 'news', 'news-article', 'gallery', 'contact', 'contact-thanks']:
    path = repo / 'mockups' / ('index.html' if name == 'index' else f'{name}/index.html')
    source = path.read_text(encoding='utf-8')
    for section, pattern in sections.items():
        partial = (repo / f'partials/{section}.html').read_text(encoding='utf-8')
        if name != 'index':
            # Partials use URLs relative to the site root; subpages are one level down.
            partial = re.sub(r'(href|src)="(?![a-z]+:|/|#)([^"]+)"',
                             lambda m: f'{m[1]}="../{m[2].removeprefix("./")}"', partial)
        source, count = re.subn(pattern, lambda _: partial, source, flags=re.S)
        assert count == 1, f'{name}: expected exactly one {section}'
    path.write_text(source, encoding='utf-8')
print('Shared header, footer and menu synchronized.')
