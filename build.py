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
        col_date = "Date"
        col_speaker = "Conférencier·ère"
        col_affiliation = "Établissement"
        col_title = "Titre"
        label_abstract = "Résumé"
        label_video = "Vidéo du séminaire :"
        label_watch = "Regarder sur YouTube"
    else:
        col_date = "Date"
        col_speaker = "Speaker"
        col_affiliation = "Affiliation"
        col_title = "Title"
        label_abstract = "Abstract"
        label_video = "Seminar Video:"
        label_watch = "Watch on YouTube"

    parts: list[str] = []

    # Wrap everything in a <details> block, open if current session
    open_attr = " open" if is_current else ""
    parts.append(f"<details{open_attr}>")
    #parts.append(f"<summary><h2>{html.escape(term)}</h2></summary>")
    parts.append(f"<summary style='font-size:1.5em; font-weight:bold; margin:0.75em 0; display:list-item;'>{html.escape(term)}</summary>")

    parts.append("<table class='seminars-table'>")
    parts.append("<thead><tr>")
    for col in [col_date, col_speaker, col_affiliation, col_title]:
        parts.append(f"<th>{html.escape(col)}</th>")
    parts.append("</tr></thead>")
    parts.append("<tbody>")

    for i, s in enumerate(seminars_sorted):
        date_raw = str(s.get("date", "")).strip()
        title = _get_lang_field(s.get("title"), lang)
        speaker = s.get("speaker") or {}
        speaker_name = _get_lang_field(speaker.get("name"), lang)
        affiliation = _get_lang_field(speaker.get("affiliation"), lang)
        affiliation_short = speaker.get("affiliation-short") or affiliation
        abstract = _get_lang_field(s.get("abstract"), lang)

        youtube = s.get("youtube") or {}
        youtube_id = ""
        if isinstance(youtube, dict):
            youtube_id = str(youtube.get("id", "")).strip()
        elif isinstance(youtube, str):
            youtube_id = youtube.strip()

        # Use key in the id to avoid collisions when multiple tables are on the same page
        detail_id = f"seminar-detail-{key}-{i}"

        # Main row — clicking toggles the detail row
        row_bg = "#f5f5f5" if i % 2 == 0 else "#ffffff"
        parts.append(
            f"<tr class='seminar-row' onclick=\"toggleDetail('{detail_id}', this)\" "
            f"style='cursor:pointer; background-color:{row_bg};'>"
        )
        parts.append(f"<td>{html.escape(date_raw[5:])}</td>")
        parts.append(f"<td>{html.escape(speaker_name)}</td>")
        parts.append(f"<td>{html.escape(affiliation_short)}</td>")
        parts.append(f"<td>{html.escape(title)}</td>")
        parts.append("</tr>")

        # Detail row — hidden by default
        parts.append(f"<tr class='seminar-detail' id='{detail_id}' style='display:none;'>")
        parts.append("<td colspan='4'>")
        if abstract:
            parts.append(f"<p><strong>{html.escape(label_abstract)}:</strong> {html.escape(abstract)}</p>")
        if youtube_id and youtube_id.lower() != "none":
            video_url = f"https://www.youtube.com/watch?v={html.escape(youtube_id)}"
            parts.append(
                f"<p><strong>{html.escape(label_video)}</strong> "
                f"<a href='{video_url}' target='_blank' rel='noopener noreferrer'>{html.escape(label_watch)}</a></p>"
            )
        parts.append("</td>")
        parts.append("</tr>")

    parts.append("</tbody>")
    parts.append("</table>")
    parts.append("</details>")

    # Inline JavaScript for the toggle
    parts.append("""
<script>
function toggleDetail(detailId, row) {
    var detail = document.getElementById(detailId);
    if (detail.style.display === 'none') {
        detail.style.display = '';
        row.classList.add('seminar-row-open');
    } else {
        detail.style.display = 'none';
        row.classList.remove('seminar-row-open');
    }
}
</script>
""")

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
    parts.append("<article class='seminars'>")

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

        parts.append("<div class='seminar-item' id='" + html.escape(_seminar_anchor(date_raw, speaker_name)) + "'>")

        if date_str:
            parts.append(f"<div class='seminar-date'><strong>{html.escape(date_str)}</strong></div>")

        sp_line = " — ".join([x for x in [speaker_name, affiliation] if x])

        parts.append("<details class='seminar-details'>")
        if title:
            parts.append(f"<summary class='seminar-title'>{html.escape(title)}</summary>")
        if sp_line:
            parts.append(f"<div class='seminar-speaker'>{html.escape(sp_line)}</div>")
        if abstract:
            parts.append(f"<div class='seminar-abstract'>{html.escape(abstract)}</div>")

        if youtube_id and youtube_id.lower() != "none":
            clean_id = youtube_id.strip()
            video_url = f"https://www.youtube.com/watch?v={html.escape(clean_id)}"
            if lang == "en":
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

        parts.append("</details>")
        parts.append("</div>")  # .seminar-item

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
        index = yaml.safe_load(SESSIONS_INDEX_PATH.read_text(encoding="utf-8")) or {}
        current_key = str(index.get("current", "")).strip()
        is_current = (key.strip() == current_key)
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

    if lang == "en":
        out_dir = OUT_DIR
    elif lang == "fr":
        out_dir = OUT_DIR / "fr"
    else:
        out_dir = OUT_DIR / lang
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

    content_html = md_to_html(body)

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