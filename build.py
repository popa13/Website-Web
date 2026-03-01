from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
import html
import shutil
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
STATIC_JS_DIR = ROOT / "content" / "js"   # put your .js files here

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
SEMINARS_TABLE_TOKEN_RE = re.compile(r"<!--\s*SEMINARS_TABLE\s*:\s*([a-zA-Z0-9_\-]+)\s*-->")

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


def _seminar_anchor(date_raw: str, speaker_name: str) -> str:
    """Generate a stable anchor id from date + speaker name."""
    slug = f"{date_raw}-{speaker_name}".lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug


def render_seminars_table(key: str, lang: str, is_current: bool = False) -> str:
    """Interactive <details> table — open if current session."""
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

    if lang == "fr":
        col_date        = "Date"
        col_speaker     = "Conférencier·ère"
        col_affiliation = "Établissement"
        col_title       = "Titre"
        label_abstract  = "Résumé"
        label_video     = "Vidéo du séminaire :"
        label_watch     = "Regarder sur YouTube"
    else:
        col_date        = "Date"
        col_speaker     = "Speaker"
        col_affiliation = "Affiliation"
        col_title       = "Title"
        label_abstract  = "Abstract"
        label_video     = "Seminar Video:"
        label_watch     = "Watch on YouTube"

    parts: list[str] = []

    # <details> wraps the whole table; open= if it is the current session
    open_attr = " open" if is_current else ""
    parts.append(f"<details{open_attr}>")
    parts.append(
        f"<summary style='font-size:1.5em; font-weight:bold; "
        f"margin:0.75em 0; display:list-item; cursor:pointer;'>"
        f"{html.escape(term)}</summary>"
    )

    parts.append("<table class='seminars-table'>")
    parts.append("<thead><tr>")
    for col in [col_date, col_speaker, col_affiliation, col_title]:
        parts.append(f"<th>{html.escape(col)}</th>")
    parts.append("</tr></thead>")
    parts.append("<tbody>")

    for idx, s in enumerate(seminars_sorted):
        date_raw     = str(s.get("date", "")).strip()
        title        = _get_lang_field(s.get("title"), lang)
        speaker      = s.get("speaker") or {}
        speaker_name = _get_lang_field(speaker.get("name"), lang)
        affil_long   = _get_lang_field(speaker.get("affiliation"), lang)
        affil_short  = _get_lang_field(speaker.get("affiliation-short"), lang) or affil_long
        abstract     = _get_lang_field(s.get("abstract"), lang)

        youtube    = s.get("youtube") or {}
        youtube_id = ""
        if isinstance(youtube, dict):
            youtube_id = str(youtube.get("id", "")).strip()
        elif isinstance(youtube, str):
            youtube_id = youtube.strip()
        if youtube_id.lower() in ("none", ""):
            youtube_id = ""

        # date display: MM-DD only
        try:
            dt = _parse_iso_date(date_raw)
            date_short = f"{dt.month:02d}-{dt.day:02d}"
        except Exception:
            date_short = date_raw

        detail_id = f"seminar-detail-{key}-{idx}"
        row_bg    = "#f5f5f5" if idx % 2 == 0 else "#ffffff"

        parts.append(
            "<tr class='seminar-row' "
            f"onclick=\"toggleDetail('{detail_id}', this)\" "
            f"style='cursor:pointer; background-color:{row_bg};'>"
        )
        cell = "padding:0.5em 0.75em; border-bottom:1px solid #eee;"
        parts.append(f"<td style='{cell} white-space:nowrap;'>{html.escape(date_short)}</td>")
        parts.append(f"<td style='{cell}'>{html.escape(speaker_name)}</td>")
        parts.append(f"<td style='{cell}'>{html.escape(affil_short)}</td>")
        parts.append(f"<td style='{cell}'>{html.escape(title)}</td>")
        parts.append("</tr>")

        # Hidden detail row
        parts.append(
            f"<tr class='seminar-detail' id='{html.escape(detail_id)}' "
            f"style='display:none;'>"
        )
        parts.append("<td colspan='4'>")
        parts.append("<div style='padding:1em; background:#f9f9f9; border-bottom:1px solid #eee;'>")
        #if affil_long and affil_long != affil_short:
        #    parts.append(f"<p style='margin:0 0 0.5em; font-style:italic;'>{html.escape(affil_long)}</p>")
        if abstract:
            parts.append(f"<p style='margin:0 0 0.75em;'><strong>{html.escape(label_abstract)} : </strong>{html.escape(abstract)}</p>")
        if youtube_id:
            video_url = f"https://www.youtube.com/watch?v={html.escape(youtube_id)}"
            parts.append(
                f"<p style='margin:0;'><strong>{html.escape(label_video)}</strong> "
                f"<a href='{video_url}' target='_blank' rel='noopener noreferrer'>"
                f"{html.escape(label_watch)}</a></p>"
            )
        parts.append("</div>")
        parts.append("</td>")
        parts.append("</tr>")

    parts.append("</tbody>")
    parts.append("</table>")
    parts.append("</details>")

    # JS toggle (injected once per table)
    parts.append("""
<script>
if (typeof toggleDetail === 'undefined') {
  function toggleDetail(detailId, row) {
    var detail = document.getElementById(detailId);
    if (detail.style.display === 'none') {
      detail.style.display = 'table-row';
      row.classList.add('seminar-row-open');
    } else {
      detail.style.display = 'none';
      row.classList.remove('seminar-row-open');
    }
  }
}
</script>
""")

    return "\n".join(parts)


def render_seminars_section(key: str, lang: str) -> str:
    """Full seminar cards with abstract and YouTube link (used by SEMINARS token)."""
    data_path = DATA_ROOT / f"seminars_{key}.yml"
    if not data_path.exists():
        return f"<p><em>Missing seminars data: {html.escape(str(data_path))}</em></p>"

    data = yaml.safe_load(data_path.read_text(encoding="utf-8")) or {}
    seminars = data.get("seminars", []) or []

    def sort_key(item):
        try:
            return _parse_iso_date(str(item.get("date", "")))
        except Exception:
            return datetime.max

    seminars_sorted = sorted(seminars, key=sort_key, reverse=True)
    parts: list[str] = ["<article class='seminars'>"]

    for s in seminars_sorted:
        date_raw     = str(s.get("date", "")).strip()
        date_str     = _fmt_date(date_raw, lang) if date_raw else ""
        title        = _get_lang_field(s.get("title"), lang)
        speaker      = s.get("speaker") or {}
        speaker_name = _get_lang_field(speaker.get("name"), lang)
        affiliation  = _get_lang_field(speaker.get("affiliation"), lang)
        abstract     = _get_lang_field(s.get("abstract"), lang)
        anchor       = _seminar_anchor(date_raw, speaker_name)

        youtube    = s.get("youtube") or {}
        youtube_id = ""
        if isinstance(youtube, dict):
            youtube_id = str(youtube.get("id", "")).strip()
        elif isinstance(youtube, str):
            youtube_id = youtube.strip()
        if youtube_id.lower() in ("none", ""):
            youtube_id = ""

        parts.append(f"<div class='seminar-item' id='{html.escape(anchor)}'>")
        if date_str:
            parts.append(f"<div class='seminar-date'><strong>{html.escape(date_str)}</strong></div>")
        if title:
            parts.append(f"<div class='seminar-title'>{html.escape(title)}</div>")
        sp_line = " — ".join([x for x in [speaker_name, affiliation] if x])
        if sp_line:
            parts.append(f"<div class='seminar-speaker'>{html.escape(sp_line)}</div>")
        if abstract:
            parts.append(f"<div class='seminar-abstract'>{html.escape(abstract)}</div>")
        if youtube_id:
            lbl_video = "Vidéo du séminaire :" if lang == "fr" else "Seminar Video:"
            lbl_yt    = "Regarder sur YouTube" if lang == "fr" else "Watch on YouTube"
            video_url = f"https://www.youtube.com/watch?v={html.escape(youtube_id)}"
            parts.append(
                f"<div class='seminar-video'><p><strong>{lbl_video}</strong> "
                f"<a href='{video_url}' target='_blank' rel='noopener noreferrer'>{lbl_yt}</a></p></div>"
            )
        parts.append("</div>")

    parts.append("</article>")
    return "\n".join(parts)


def inject_dynamic_sections(body: str, lang: str) -> str:
    # Replace archive tokens first
    def repl_archive(match: re.Match) -> str:
        key = match.group(1)
        return render_seminar_archive(key, lang)

    body = ARCHIVE_TOKEN_RE.sub(repl_archive, body)

    # Replace seminars table tokens
    def repl_table(match: re.Match) -> str:
        key = match.group(1)
        if SESSIONS_INDEX_PATH.exists():
            index = yaml.safe_load(SESSIONS_INDEX_PATH.read_text(encoding="utf-8")) or {}
            current_key = str(index.get("current", "")).strip()
            is_current = (key.strip() == current_key)
        else:
            is_current = False
        return render_seminars_table(key, lang, is_current=is_current)

    body = SEMINARS_TABLE_TOKEN_RE.sub(repl_table, body)

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
        css_href = "style-v2.css"
    else:
        en_href = f"../{page}"
        fr_href = page
        zh_href = f"../zh/{page}"
        css_href = "../style-v2.css"

    page_title = meta.get("page_title", stem.replace("-", " ").title())
    active_page = meta.get("nav", "")  # your template can ignore unknown values
    wide = meta.get("wide", False)

    content_html = md_to_html(body)

    # Keep your existing nav hrefs (adjust if you have a seminars tab later)
    html_out = template.render(
        page_title=page_title,
        active_page=active_page,
        lang=lang,
        content=content_html,
        home_href="index.html",
        wide=wide,
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


def copy_static_js() -> None:
    """Copy all .js files from content/js/ to public/ and all language subfolders."""
    if not STATIC_JS_DIR.exists():
        return
    
    # Collect all output directories that exist or will be created
    dest_dirs = [OUT_DIR]
    for lang in LANGS:
        if lang != "en":
            dest_dirs.append(OUT_DIR / lang)

    for js_file in STATIC_JS_DIR.glob("*.js"):
        for dest_dir in dest_dirs:
            dest_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(js_file, dest_dir / js_file.name)
            print(f"Copied {js_file.name} → {dest_dir.relative_to(ROOT)}/")


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    copy_static_js()

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