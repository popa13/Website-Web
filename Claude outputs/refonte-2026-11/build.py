from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
import sys
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

# Look of the site: (template, stylesheet in public/).
#   python3 build.py       -> current look (v2)
#   python3 build.py v3    -> new look (v3), to try it locally
THEMES = {
    "v2": ("base.html", "style-v2.css"),
    "v3": ("base-v3.html", "style-v3.css"),
}
THEME = "v2"
if len(sys.argv) > 1 and sys.argv[1] in THEMES:
    THEME = sys.argv[1]
TEMPLATE_FILE, CSS_FILE = THEMES[THEME]

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)
template = env.get_template(TEMPLATE_FILE)


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


def _split_paragraphs(text: str) -> list[str]:
    """Split an abstract into paragraphs on line breaks.

    YAML folds a blank line inside a double-quoted scalar into a single newline
    (and a block scalar keeps two), so any run of newlines is a paragraph break.
    """
    paras = [p.strip() for p in re.split(r"\n+", text.strip())]
    return [p for p in paras if p] or [""]


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
            paras = _split_paragraphs(abstract)
            parts.append(
                f"<p style='margin:0 0 0.75em;'><strong>{html.escape(label_abstract)} : </strong>"
                f"{html.escape(paras[0])}</p>"
            )
            for para in paras[1:]:
                parts.append(f"<p style='margin:0 0 0.75em;'>{html.escape(para)}</p>")
        if youtube_id:
            video_url = f"https://www.youtube.com/watch?v={html.escape(youtube_id)}"
            #parts.append(
             #   f"<p style='margin:0;'><strong>{html.escape(label_video)}</strong> "
             #   f"<a href='{video_url}' target='_blank' rel='noopener noreferrer'>"
             #   f"{html.escape(label_watch)}</a></p>"
            #)
            parts.append(
                f"<p style='margin:0;'><strong>{html.escape(label_video)}</strong></p>"
                f"<iframe width='560' height='315' "
                f"src='https://www.youtube-nocookie.com/embed/{html.escape(youtube_id)}' "
                f"title='YouTube video player' frameborder='0' "
                f"allow='accelerometer; autoplay; clipboard-write; encrypted-media; "
                f"gyroscope; picture-in-picture; web-share' "
                f"referrerpolicy='strict-origin-when-cross-origin' allowfullscreen></iframe>"
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
            paras_html = "".join(f"<p>{html.escape(p)}</p>" for p in _split_paragraphs(abstract))
            parts.append(f"<div class='seminar-abstract'>{paras_html}</div>")
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


# -----------------------------
# Publications & students
#   content/data/publications.yml  ->  <!-- PUBLICATIONS:submitted|accepted|published -->
#   content/data/students.yml      ->  <!-- STUDENTS:masters|undergraduate -->
# Same idea as the seminars table: one row per item, a click (or Enter)
# opens a detail row with the abstract / details.
# -----------------------------
PUBLICATIONS_TOKEN_RE = re.compile(r"<!--\s*PUBLICATIONS\s*:\s*([a-zA-Z_]+)\s*-->")
STUDENTS_TOKEN_RE = re.compile(r"<!--\s*STUDENTS\s*:\s*([a-zA-Z_]+)\s*-->")
PUBLICATIONS_PATH = DATA_ROOT / "publications.yml"
STUDENTS_PATH = DATA_ROOT / "students.yml"

# Names written in bold in author lists
SELF_NAMES = ["P.-O. Parisé"]

DD_LABELS = {
    "en": {
        "title": "Title", "authors": "Authors", "venue": "Journal", "submitted": "Submitted",
        "abstract": "Abstract", "abstract_en": "Abstract",
        "year": "Year", "student": "Student", "project": "Project",
        "funding": "Funding", "cosupervisor": "Co-supervisor", "report": "Report",
        "no_abstract": "No abstract online.", "to_appear": "to appear",
        "open_all": "Expand all", "close_all": "Collapse all",
        "hint": "Click a row to show the abstract.", "hint_students": "Click a row to show the details.",
    },
    "fr": {
        "title": "Titre", "authors": "Auteurs", "venue": "Revue", "submitted": "Soumis",
        "abstract": "Résumé", "abstract_en": "Résumé (en anglais)",
        "year": "Année", "student": "Étudiant·e", "project": "Projet",
        "funding": "Financement", "cosupervisor": "Codirection", "report": "Rapport",
        "no_abstract": "Pas de résumé en ligne.", "to_appear": "à paraître",
        "open_all": "Tout déplier", "close_all": "Tout replier",
        "hint": "Cliquez sur une ligne pour afficher le résumé.",
        "hint_students": "Cliquez sur une ligne pour afficher les détails.",
    },
}

MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"],
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
           "août", "septembre", "octobre", "novembre", "décembre"],
}

# Toggle script, written once per page (guarded)
DD_SCRIPT = """
<script>
if (!window.ddToggle) {
  window.ddToggle = function (row, force) {
    var d = row.nextElementSibling;
    if (!d || !d.classList.contains('dd-detail')) return;
    var open = (force === undefined) ? d.hidden : force;
    d.hidden = !open;
    row.classList.toggle('seminar-row-open', open);
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  window.ddAll = function (btn) {
    var sec = btn.closest('.dd-section');
    var open = btn.getAttribute('aria-pressed') !== 'true';
    sec.querySelectorAll('.dd-row').forEach(function (r) { ddToggle(r, open); });
    btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    btn.textContent = open ? btn.dataset.close : btn.dataset.open;
  };
  document.addEventListener('keydown', function (e) {
    var r = e.target.closest && e.target.closest('.dd-row');
    if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ddToggle(r); }
  });
}
</script>
"""

_YAML_CACHE: dict = {}


def _load_yaml(path: Path) -> dict:
    if path not in _YAML_CACHE:
        _YAML_CACHE[path] = (yaml.safe_load(path.read_text(encoding="utf-8")) or {}) if path.exists() else {}
    return _YAML_CACHE[path]


def _fix_url(url: str, lang: str) -> str:
    """Site-relative links (documents/...) need ../ on the /fr and /zh pages."""
    url = str(url).strip()
    if lang == "en" or re.match(r"^([a-z]+:|/|#|\.\./)", url):
        return url
    return "../" + url


def _bold_self(authors_html: str) -> str:
    for name in SELF_NAMES:
        esc = html.escape(name)
        authors_html = authors_html.replace(esc, f"<strong>{esc}</strong>")
    return authors_html


def _links_html(links, lang: str) -> str:
    out = []
    for ln in links or []:
        label = _get_lang_field(ln.get("label"), lang) or "Link"
        url = _fix_url(ln.get("url", ""), lang)
        if not url:
            continue
        out.append(
            f"<a class='dd-link' href='{html.escape(url)}' target='_blank' rel='noopener'>"
            f"{html.escape(label)} <span aria-hidden='true'>↗</span></a>"
        )
    return f"<p class='dd-links'>{' '.join(out)}</p>" if out else ""


def _dd_section(*, sec_id: str, title: str, count: int, head: list[str], hide_sm: set[int],
                body_rows: list[str], lang: str, hint: str, kind: str) -> str:
    L = DD_LABELS[lang]
    parts = [f"<details class='dd-section' id='{html.escape(sec_id)}' open>"]
    parts.append(
        f"<summary class='dd-summary'><span class='dd-summary-title'>{html.escape(title)}</span>"
        f" <span class='dd-count'>{count}</span></summary>"
    )
    parts.append(
        "<div class='dd-tools'>"
        f"<span class='dd-hint'>{html.escape(hint)}</span>"
        f"<button type='button' class='dd-expand' aria-pressed='false' "
        f"data-open='{html.escape(L['open_all'])}' data-close='{html.escape(L['close_all'])}' "
        f"onclick='ddAll(this)'>{html.escape(L['open_all'])}</button></div>"
    )
    parts.append(f"<table class='dd-table dd-{kind}'>")
    ths = "".join(
        ("<th class='dd-hide-sm'>" if i in hide_sm else "<th>") + html.escape(h) + "</th>"
        for i, h in enumerate(head)
    )
    parts.append(f"<thead><tr>{ths}</tr></thead><tbody>")
    parts.extend(body_rows)
    parts.append("</tbody></table></details>")
    parts.append(DD_SCRIPT.strip())
    return "\n".join(parts)


def _dd_rows(row_id: str, cells: list[str], hide_sm: set[int], detail_html: str, odd: bool) -> list[str]:
    tds = "".join(
        f"<td class='dd-c{i}{' dd-hide-sm' if i in hide_sm else ''}'>{c}</td>" for i, c in enumerate(cells)
    )
    return [
        f"<tr class='seminar-row dd-row{' dd-odd' if odd else ''}' tabindex='0' role='button' "
        f"aria-expanded='false' aria-controls='{row_id}' onclick='ddToggle(this)'>{tds}</tr>",
        f"<tr class='seminar-detail dd-detail' id='{row_id}' hidden><td colspan='{len(cells)}'>"
        f"<div class='dd-body'>{detail_html}</div></td></tr>",
    ]


def render_publications(status: str, lang: str) -> str:
    data = _load_yaml(PUBLICATIONS_PATH)
    if not data:
        return f"<p><em>Missing publications data: {html.escape(str(PUBLICATIONS_PATH))}</em></p>"
    L = DD_LABELS.get(lang, DD_LABELS["en"])
    lang_l = lang if lang in DD_LABELS else "en"
    sec = (data.get("sections") or {}).get(status, {})
    items = [p for p in (data.get("publications") or []) if str(p.get("status", "")).strip() == status]
    # most recent first; papers without a month keep the order of the file
    items = sorted(items, key=lambda p: (int(p.get("year") or 0), int(p.get("month") or 0)), reverse=True)

    hide_sm = {1, 2}
    if status == "submitted":
        head = [L["title"], L["authors"], L["submitted"]]
    else:
        head = [L["title"], L["authors"], L["venue"]]

    rows: list[str] = []
    current_year = None
    for idx, p in enumerate(items):
        year = int(p.get("year") or 0)
        if status == "published" and year != current_year:
            current_year = year
            rows.append(f"<tr class='dd-group'><th colspan='3' scope='colgroup'>{year}</th></tr>")

        title = html.escape(_get_lang_field(p.get("title"), lang))
        authors = _bold_self(html.escape(_get_lang_field(p.get("authors"), lang)))
        venue = html.escape(_get_lang_field(p.get("venue"), lang))
        if status == "accepted" and venue:
            venue += f" <span class='dd-muted'>({html.escape(L['to_appear'])})</span>"
        if status == "submitted":
            m = int(p.get("month") or 0)
            venue = html.escape(f"{MONTHS[lang_l][m - 1]} {year}" if m else str(year))

        # detail
        citation = _get_lang_field(p.get("citation"), lang)
        note = _get_lang_field(p.get("note"), lang)
        ref = f"{authors}. <em>{title}</em>."
        if citation:
            ref += f" {html.escape(citation)}"
        detail = [f"<p class='dd-cite'>{ref}</p>"]
        if note:
            detail.append(f"<p class='dd-note'>{html.escape(note)}</p>")
        abstract_raw = p.get("abstract")
        abstract = _get_lang_field(abstract_raw, lang)
        if abstract:
            lbl = L["abstract_en"] if (lang != "en" and isinstance(abstract_raw, str)) else L["abstract"]
            paras = _split_paragraphs(abstract)
            detail.append(f"<p class='dd-abstract'><strong>{html.escape(lbl)}.</strong> {html.escape(paras[0])}</p>")
            detail.extend(f"<p class='dd-abstract'>{html.escape(x)}</p>" for x in paras[1:])
        elif not note:
            detail.append(f"<p class='dd-muted'>{html.escape(L['no_abstract'])}</p>")
        detail.append(_links_html(p.get("links"), lang))

        rows.extend(_dd_rows(f"dd-pub-{status}-{idx}", [title, authors, venue or "—"], hide_sm,
                             "".join(detail), odd=(idx % 2 == 1)))

    return _dd_section(
        sec_id=sec.get("id", status), title=_get_lang_field(sec.get("title"), lang) or status,
        count=len(items), head=head, hide_sm=hide_sm, body_rows=rows, lang=lang_l, hint=L["hint"],
        kind="pubs",
    )


def render_students(group: str, lang: str) -> str:
    data = _load_yaml(STUDENTS_PATH)
    if not data:
        return f"<p><em>Missing students data: {html.escape(str(STUDENTS_PATH))}</em></p>"
    lang_l = lang if lang in DD_LABELS else "en"
    L = DD_LABELS[lang_l]
    sec = (data.get("sections") or {}).get(group, {})
    items = (data.get("students") or {}).get(group, []) or []
    hide_sm: set[int] = set()

    rows: list[str] = []
    for idx, s in enumerate(items):
        year = html.escape(str(s.get("year", "")))
        name = html.escape(_get_lang_field(s.get("name"), lang))
        project = html.escape(_get_lang_field(s.get("project"), lang))
        detail = [f"<p class='dd-cite'><strong>{name}</strong> ({year}). <em>{project}</em>.</p>", "<dl class='dd-facts'>"]
        for key in ("funding", "cosupervisor", "report", "note"):
            val = _get_lang_field(s.get(key), lang)
            if val:
                label = L.get(key, "")
                detail.append(f"<dt>{html.escape(label)}</dt><dd>{html.escape(val)}</dd>" if label
                              else f"<dd>{html.escape(val)}</dd>")
        detail.append("</dl>")
        detail.append(_links_html(s.get("links"), lang))
        rows.extend(_dd_rows(f"dd-stu-{group}-{idx}", [year, name, project], hide_sm,
                             "".join(detail), odd=(idx % 2 == 1)))

    return _dd_section(
        sec_id=sec.get("id", group), title=_get_lang_field(sec.get("title"), lang) or group,
        count=len(items), head=[L["year"], L["student"], L["project"]], hide_sm=hide_sm,
        body_rows=rows, lang=lang_l, hint=L["hint_students"], kind="students",
    )


def inject_dynamic_sections(body: str, lang: str, stem: str = "") -> str:
    # Replace archive tokens first
    def repl_archive(match: re.Match) -> str:
        key = match.group(1)
        return render_seminar_archive(key, lang)

    body = ARCHIVE_TOKEN_RE.sub(repl_archive, body)

    # Replace seminars table tokens
    def repl_table(match: re.Match) -> str:
        key = match.group(1).strip()
        is_open = False
        if SESSIONS_INDEX_PATH.exists():
            index = yaml.safe_load(SESSIONS_INDEX_PATH.read_text(encoding="utf-8")) or {}
            current_key = str(index.get("current", "")).strip()
            is_open = (key == current_key)
            # A session's own page (stem == its slug) always shows its table open.
            for s in index.get("sessions", []) or []:
                if (str(s.get("key", "")).strip() == key
                        and str(s.get("slug", "")).strip() == stem):
                    is_open = True
        return render_seminars_table(key, lang, is_current=is_open)

    body = SEMINARS_TABLE_TOKEN_RE.sub(repl_table, body)

    # Replace seminars tokens
    def repl_seminars(match: re.Match) -> str:
        key = match.group(1)
        return render_seminars_section(key, lang)

    body = SEMINARS_TOKEN_RE.sub(repl_seminars, body)

    # Publications and students (content/data/publications.yml, students.yml)
    body = PUBLICATIONS_TOKEN_RE.sub(lambda m: render_publications(m.group(1).strip(), lang), body)
    body = STUDENTS_TOKEN_RE.sub(lambda m: render_students(m.group(1).strip(), lang), body)
    return body


def render_page(*, lang: str, stem: str) -> None:
    in_path = CONTENT_ROOT / lang / f"{stem}.md"
    if not in_path.exists():
        return

    raw = in_path.read_text(encoding="utf-8")
    meta, body = split_frontmatter(raw)

    body = inject_dynamic_sections(body, lang, stem=stem)
    page = out_name(stem)

    out_dir = OUT_DIR if lang == "en" else (OUT_DIR / lang)
    out_dir.mkdir(parents=True, exist_ok=True)

    if lang == "en":
        en_href = page
        fr_href = f"fr/{page}"
        zh_href = f"zh/{page}"  # unused but kept if template expects it
        root = ""
    elif lang == "fr":
        en_href = f"../{page}"
        fr_href = page
        zh_href = f"../zh/{page}"
        root = "../"
    else:  # zh
        en_href = f"../{page}"
        fr_href = f"../fr/{page}"
        zh_href = page
        root = "../"
    css_href = root + CSS_FILE

    # page_title (or title) from the front matter
    page_title = meta.get("page_title") or meta.get("title") or stem.replace("-", " ").title()
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
        miscellaneous_href="miscellaneous.html",
        en_href=en_href,
        fr_href=fr_href,
        zh_href=zh_href,
        css_href=css_href,
        root=root,
        description=meta.get("description", ""),
        page=meta,
        build_date=_fmt_date(datetime.now().strftime("%Y-%m-%d"), lang),
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


# Pages HTML autonomes à copier telles quelles dans public/
# Format : (source, destination relative à OUT_DIR)
STANDALONE_PAGES = [
    ("untitled.html", "essence.html"),
]


# Dossiers d'applications autonomes (HTML/CSS/JS) copiés tels quels dans public/,
# en conservant leur structure. Format : (source relative à la racine du dépôt,
# destination relative à public/). Les pages content/<lang>/*.md les intègrent
# dans un <iframe> ou y renvoient par un lien.
STANDALONE_DIRS = [
    ("apps/riemann-darboux", "apps/riemann-darboux"),
    ("apps/verdelune", "apps/verdelune"),
    ("apps/preuves-a-trous", "apps/preuves-a-trous"),
    ("apps/convergence-uniforme", "apps/convergence-uniforme"),
    ("apps/bornes", "apps/bornes"),   # carte des bornes ; données : python3 update-bornes.py
    ("apps/tours-hanoi", "apps/tours-hanoi"),   # tours de Hanoï (page Divers)
    ("apps/rearrangements", "apps/rearrangements"),   # réarranger une série (cours MPU1054)
]


def copy_standalone_dirs() -> None:
    """Copy standalone app folders (HTML/CSS/JS) into public/."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, dst_name in STANDALONE_DIRS:
        src = ROOT / src_name
        dst = OUT_DIR / dst_name
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
            print(f"Copied {src_name}/ → public/{dst_name}/")
        else:
            print(f"Warning: {src_name} not found, skipping.")


def copy_standalone_pages() -> None:
    """Copy standalone HTML apps into public/."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, dst_name in STANDALONE_PAGES:
        src = ROOT / src_name
        dst = OUT_DIR / dst_name
        if src.exists():
            shutil.copy2(src, dst)
            print(f"Copied {src_name} → public/{dst_name}")
        else:
            print(f"Warning: {src_name} not found, skipping.")


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    copy_static_js()
    copy_standalone_pages()
    copy_standalone_dirs()

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
