"""Synchronize shared static chrome without requiring JavaScript to render navigation."""
from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
sections = {
    'header': r'<header class="lr-header">.*?</header>',
    'footer': r'<footer class="lr-footer">.*?</footer>',
    'menu': r'<dialog id="mobile-menu".*?</dialog>',
}
for name in ['index.html', 'collection.html', 'product.html', 'about.html', 'news.html', 'news-article.html', 'gallery.html', 'contact.html', 'contact-thanks.html']:
    path = repo / 'mockups' / name
    source = path.read_text(encoding='utf-8')
    for section, pattern in sections.items():
        partial = (repo / f'partials/{section}.html').read_text(encoding='utf-8')
        source, count = re.subn(pattern, lambda _: partial, source, flags=re.S)
        assert count == 1, f'{name}: expected exactly one {section}'
    path.write_text(source, encoding='utf-8')
print('Shared header, footer and menu synchronized.')
