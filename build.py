from __future__ import annotations

from pathlib import Path
import shutil
import yaml
try:
    import markdown as md  # type: ignore
except Exception:
    md = None  # fallback: treat body as already-HTML

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
CONTENT_DIR = ROOT / "content" / "en"
TEMPLATES_DIR = ROOT / "templates"
PUBLIC_DIR = ROOT / "public"

PAGES = [
    ("index", "home"),
    ("research", "research"),
    ("teaching", "teaching"),
    ("tetrabrot", "tetrabrot"),
]

def split_frontmatter(text: str) -> tuple[dict, str]:
    """
    Parse YAML frontmatter delimited by '---' at the top of the file.
    Returns (meta, body).
    """
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            _, fm, body = parts
            meta = yaml.safe_load(fm) or {}
            return meta, body.lstrip()
    return {}, text

def render_markdown(body: str) -> str:
    """
    Convert Markdown to HTML. If the 'Markdown' package isn't available,
    fall back to returning the body unchanged (useful when the body already
    contains raw HTML, as in this site).
    """
    if md is None:
        return body
    converter = md.Markdown(extensions=["fenced_code", "tables", "toc"])
    return converter.convert(body)

def ensure_public_dir() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

def copy_static_assets() -> None:
    # Copy style.css (and any other simple static files you add later).
    src = ROOT / "style.css"
    if src.exists():
        shutil.copy2(src, PUBLIC_DIR / "style.css")

def build() -> None:
    ensure_public_dir()
    copy_static_assets()

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("base.html")

    for stem, nav in PAGES:
        md_path = CONTENT_DIR / f"{stem}.md"
        if not md_path.exists():
            raise FileNotFoundError(f"Missing content file: {md_path}")

        raw = md_path.read_text(encoding="utf-8")
        meta, body = split_frontmatter(raw)

        page_title = meta.get("page_title", "Mathopo")
        active_page = meta.get("nav", nav)

        # Lowercase canonical filenames
        out_name = "index.html" if stem == "index" else f"{stem}.html"

        # Language switch links (French pages are expected in /fr/ with -fr suffix)
        en_href = out_name
        fr_name = "index-fr.html" if stem == "index" else f"{stem}-fr.html"
        fr_href = f"fr/{fr_name}"

        content_html = render_markdown(body)

        html = template.render(
            page_title=page_title,
            active_page=active_page,
            en_href=en_href,
            fr_href=fr_href,
            content=content_html,
        )

        out_path = PUBLIC_DIR / out_name
        out_path.write_text(html, encoding="utf-8")
        print(f"Wrote {out_path.relative_to(ROOT)}")

if __name__ == "__main__":
    build()
