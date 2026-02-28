from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
import html
import yaml

try:
    import markdown as md  # pip install Markdown
except Exception:
    md = None

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
CONTENT_ROOT = ROOT / "content"
DATA_ROOT = CONTENT_ROOT / "data"
TEMPLATES_DIR = ROOT / "templates"
OUT_DIR = ROOT / "public"

# Compile french, english and chinese
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
    if md is None:
        return body
    converter = md.Markdown(extensions=MD_EXTENSIONS)
    return converter.convert(body)


def out_name(stem: str) -> str:
    # keep same stem -> stem.html, except index.md -> index.html
    stem = stem.lower()
    return "index.html" if stem == "index" else f"{stem}.html"


# -----------------------------
# Seminars injection
# -----------------------------
SEMINARS_TOKEN_RE = re.compile(r"<!--\s*SEMINARS\s*:\s*([a-zA-Z0-9_\-]+)\s*-->")
ARCHIVE_TOKEN_RE = re.compile(r"<!--\s*SEMINAR_ARCHIVE\s*:\s*([a-zA-Z0-9_\-]+)\s*-->")

SESSIONS_INDEX_PATH = DATA_ROOT / "seminars_sessions.yml"


def _parse_iso_date(d: str) -> datetime:
    return datetime.strptime(d.strip(), "%Y-%m-%d")


def _fmt_date(d: str, lang: str) -> str:
    dt = _parse_iso_date(d)
    if lang == "fr":
        months = [
            "janvier", "février", "mars", "avril", "mai", "juin",
            "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ]
        return f"{dt.day} {months[dt.month - 1]} {dt.year}"
    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    return f"{months[dt.month - 1]} {dt.day}, {dt.year}"


def _get_lang_field(v, lang: str) -> str:
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return str(v.get(lang) or v.get("en") or v.get("fr") or "")
    return str(v)


def _page_href_for_slug(slug: str, lang: str) -> str:
    # When you are in EN pages at site root:
    #   seminars-winter2026.html
    # When you are in FR pages under /fr:
    #   /fr/seminars-winter2026.html (relative path inside templates is handled via css_href etc.)
    filename = out_name(slug)
    if lang == "fr":
        return filename  # within /fr folder
    return filename


def render_seminar_archive(current_key: str, lang: str) -> str:
    if not SESSIONS_INDEX_PATH.exists():
        return ""

    index = yaml.safe_load(SESSIONS_INDEX_PATH.read_text(encoding="utf-8")) or {}
    sessions = index.get("sessions", []) or []
    current_from_file = str(index.get("current", "")).strip()

    # Special token: landing page wants "current session" + "previous sessions"
    is_landing = (current_key.strip() == "__landing__")
    effective_current = current_from_file if is_landing else (current_key or current_from_file)

    # locate current session object
    current_obj = None
    for s in sessions:
        if str(s.get("key", "")).strip() == effective_current:
            current_obj = s
            break

    others = [s for s in sessions if str(s.get("key", "")).strip() and str(s.get("key", "")).strip() != effective_current]

    parts = []
    parts.append("<nav class='seminar-archive'>")

    if is_landing and current_obj:
        title_now = "Current session" if lang == "en" else "Session en cours"
        slug = str(current_obj.get("slug", "")).strip()
        text = _get_lang_field(current_obj.get("title"), lang) or slug
        href = _page_href_for_slug(slug, lang)
        parts.append(f"<h2>{html.escape(title_now)}</h2>")
        parts.append(f"<p><a href='{html.escape(href)}'>{html.escape(text)}</a></p>")

    if others:
        title_prev = "Previous sessions" if lang == "en" else "Sessions précédentes"
        parts.append(f"<h2>{html.escape(title_prev)}</h2>")
        parts.append("<ul>")
        for s in others:
            slug = str(s.get("slug", "")).strip()
            if not slug:
                continue
            text = _get_lang_field(s.get("title"), lang) or slug
            href = _page_href_for_slug(slug, lang)
            parts.append(f"<li><a href='{html.escape(href)}'>{html.escape(text)}</a></li>")
        parts.append("</ul>")

    parts.append("</nav>")
    return "\n".join(parts)


def render_seminars_section(key: str, lang: str) -> str:
    data_path = DATA_ROOT / f"seminars_{key}.yml"
    if not data_path.exists():
        return f"<p><em>Missing seminars data: {html.escape(str(data_path))}</em></p>"

    data = yaml.safe_load(data_path.read_text(encoding="utf-8")) or {}
    seminars = data.get("seminars", []) or []
    term = _get_lang_field(data.get("term"), lang) or ("Seminars" if lang == "en" else "Séminaires")

    def sort_key(item):
        try:
            return _parse_iso_date(str(item.get("date", "")))
        except Exception:
            return datetime.max

    seminars_sorted = sorted(seminars, key=sort_key, reverse=True)

    parts: list[str] = []
    parts.append(f"<article class='seminars'>")

    for s in seminars_sorted:
        date_raw = str(s.get("date", "")).strip()
        date_str = _fmt_date(date_raw, lang) if date_raw else ""

        title = _get_lang_field(s.get("title"), lang)
        speaker = s.get("speaker") or {}
        speaker_name = _get_lang_field(speaker.get("name"), lang)
        affiliation = _get_lang_field(speaker.get("affiliation"), lang)
        abstract = _get_lang_field(s.get("abstract"), lang)

        youtube = s.get("youtube") or {}
        youtube_id = ""
        if isinstance(youtube, dict):
            youtube_id = str(youtube.get("id", "")).strip()
        elif isinstance(youtube, str):
            youtube_id = youtube.strip()

        parts.append("<div class='seminar-item'>")

        # Order requested:
        # 1) date
        if date_str:
            parts.append(f"<div class='seminar-date'><strong>{html.escape(date_str)}</strong></div>")

        # 2) title
        if title:
            parts.append(f"<div class='seminar-title'>{html.escape(title)}</div>")

        # 3) speaker + affiliation
        sp_line = " — ".join([x for x in [speaker_name, affiliation] if x])
        if sp_line:
            parts.append(f"<div class='seminar-speaker'>{html.escape(sp_line)}</div>")

        # 4) abstract
        if abstract:
            parts.append(f"<div class='seminar-abstract'>{html.escape(abstract)}</div>")

        # 5) YouTube Link (Multilingual)
        print(f"DEBUG: '{youtube_id}' (longueur: {len(youtube_id)})")
        if youtube_id:
            clean_id = youtube_id.strip()
            video_url = f"https://www.youtube.com/watch?v={html.escape(clean_id)}"
            
            # Définition des textes selon la langue
            if lang == 'en':
                link_text = "Watch on YouTube"
                prefix_text = "Seminar Video:"
            else:
                link_text = "Regarder sur YouTube"
                prefix_text = "Vidéo du séminaire :"
            
            parts.append(
                "<div class='seminar-video'>"
                f"<p><strong>{prefix_text}</strong> "
                f"<a href='{video_url}' target='_blank' rel='noopener noreferrer'>"
                f"{link_text}"
                "</a></p>"
                "</div>"
            )

        parts.append("</div>")  # .seminar-item

    parts.append("</article>")
    return "\n".join(parts)


def inject_dynamic_sections(body: str, lang: str) -> str:
    # Replace archive tokens first
    def repl_archive(match: re.Match) -> str:
        key = match.group(1)
        return render_seminar_archive(key, lang)

    body = ARCHIVE_TOKEN_RE.sub(repl_archive, body)

    # Replace seminars tokens
    def repl_seminars(match: re.Match) -> str:
        key = match.group(1)
        return render_seminars_section(key, lang)

    body = SEMINARS_TOKEN_RE.sub(repl_seminars, body)
    return body


def render_page(*, lang: str, stem: str) -> None:
    in_path = CONTENT_ROOT / lang / f"{stem}.md"
    if not in_path.exists():
        return

    raw = in_path.read_text(encoding="utf-8")
    meta, body = split_frontmatter(raw)

    body = inject_dynamic_sections(body, lang)
    page = out_name(stem)

    out_dir = OUT_DIR if lang == "en" else (OUT_DIR / "fr")
    out_dir.mkdir(parents=True, exist_ok=True)

    if lang == "en":
        en_href = page
        fr_href = f"fr/{page}"
        zh_href = f"zh/{page}"  # unused but kept if template expects it
        css_href = "style.css"
    else:
        en_href = f"../{page}"
        fr_href = page
        zh_href = f"../zh/{page}"
        css_href = "../style.css"

    page_title = meta.get("page_title", stem.replace("-", " ").title())
    active_page = meta.get("nav", "")  # your template can ignore unknown values

    content_html = md_to_html(body)

    # Keep your existing nav hrefs (adjust if you have a seminars tab later)
    html_out = template.render(
        page_title=page_title,
        active_page=active_page,
        lang=lang,
        content=content_html,
        home_href="index.html",
        research_href="research.html",
        teaching_href="teaching.html",
        tetrabrot_href="tetrabrot.html",
        seminars_href="seminars.html",
        en_href=en_href,
        fr_href=fr_href,
        zh_href=zh_href,
        css_href=css_href,
    )

    (out_dir / page).write_text(html_out, encoding="utf-8")
    print(f"Wrote {(out_dir / page).relative_to(ROOT)}")


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for lang in LANGS:
        lang_dir = CONTENT_ROOT / lang
        if not lang_dir.exists():
            continue

        # Build every .md file in that language folder
        for md_file in sorted(lang_dir.glob("*.md")):
            stem = md_file.stem
            render_page(lang=lang, stem=stem)


if __name__ == "__main__":
    build()