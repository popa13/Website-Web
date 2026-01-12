from __future__ import annotations

from pathlib import Path
import yaml

try:
    import markdown as md  # pip install Markdown
except Exception:
    md = None  # If Markdown isn't installed, treat page bodies as already-HTML.

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
CONTENT_ROOT = ROOT / "content"          # expects content/en, content/fr, content/zh
TEMPLATES_DIR = ROOT / "templates"

# IMPORTANT: output is NOT "public/" to avoid touching archived class sites.
# Point Netlify's publish directory to this folder (see netlify.toml).
OUT_DIR = ROOT / "public"

# Pages we compile (normalized to lowercase outputs).
PAGES = ["index", "research", "teaching", "tetrabrot"]

# Languages we compile
LANGS = ["en", "fr", "zh"]

MD_EXTENSIONS = ["fenced_code", "tables", "toc"]

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)
template = env.get_template("base.html")


def split_frontmatter(text: str) -> tuple[dict, str]:
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            _, fm, body = parts
            meta = yaml.safe_load(fm) or {}
            return meta, body.lstrip()
    return {}, text


def md_to_html(body: str) -> str:
    # Your content can be Markdown or raw HTML.
    if md is None:
        return body
    converter = md.Markdown(extensions=MD_EXTENSIONS)
    return converter.convert(body)


def out_name(stem: str) -> str:
    stem = stem.lower()
    return "index.html" if stem == "index" else f"{stem}.html"


def render_page(*, lang: str, stem: str) -> None:
    in_path = CONTENT_ROOT / lang / f"{stem}.md"
    if not in_path.exists():
        # Optional debug:
        # print(f"SKIP (missing): {in_path.relative_to(ROOT)}")
        return

    raw = in_path.read_text(encoding="utf-8")
    meta, body = split_frontmatter(raw)

    page = out_name(stem)  # e.g. research.html

    # Output directory:
    # - English: site/
    # - French:  site/fr/
    # - Chinese: site/zh/
    out_dir = {
        "en": OUT_DIR,
        "fr": OUT_DIR / "fr",
        "zh": OUT_DIR / "zh",
    }.get(lang, OUT_DIR)

    out_dir.mkdir(parents=True, exist_ok=True)

    # Relative paths that work BOTH on Netlify and when opening files locally.
    if lang == "en":
        # From public/*.html
        home_href = "index.html"
        research_href = "research.html"
        teaching_href = "teaching.html"
        tetrabrot_href = "tetrabrot.html"

        en_href = page
        fr_href = f"fr/{page}"
        zh_href = f"zh/{page}"

        css_href = "style.css"

    elif lang == "fr":
        # From public/fr/*.html
        home_href = "index.html"
        research_href = "research.html"
        teaching_href = "teaching.html"
        tetrabrot_href = "tetrabrot.html"

        en_href = f"../{page}"
        fr_href = page
        zh_href = f"../zh/{page}"

        css_href = "../style.css"

    elif lang == "zh":
        # From public/zh/*.html
        home_href = "index.html"
        research_href = "research.html"
        teaching_href = "teaching.html"
        tetrabrot_href = "tetrabrot.html"

        en_href = f"../{page}"
        fr_href = f"../fr/{page}"
        zh_href = page

        css_href = "../style.css"

    else:
        raise ValueError(f"Unsupported language: {lang}")

    # Your frontmatter uses page_title, not title
    page_title = meta.get("page_title", stem.title())
    active_page = meta.get("nav", ("home" if stem == "index" else stem))

    content_html = md_to_html(body)

    html = template.render(
        page_title=page_title,
        active_page=active_page,
        lang=lang,
        content=content_html,
        # Navbar hrefs
        home_href=home_href,
        research_href=research_href,
        teaching_href=teaching_href,
        tetrabrot_href=tetrabrot_href,
        # Language switch hrefs
        en_href=en_href,
        fr_href=fr_href,
        zh_href=zh_href,
        # Assets
        css_href=css_href,
    )

    (out_dir / page).write_text(html, encoding="utf-8")
    print(f"Wrote {(out_dir / page).relative_to(ROOT)}")


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stem in PAGES:
        for lang in LANGS:
            render_page(lang=lang, stem=stem)


if __name__ == "__main__":
    build()

