# Renderers

textforge supports four registered HTML renderer profiles. Renderer selection is per topic through `render.json`, while the parsed `spec.md` model stays unchanged.

## Recommended Path

For new topics, use one path only:

- Add a topic-level `render.json` next to `spec.md`
- Set `"renderer": "html/default-v2"`
- Treat the v1 renderer profiles as backward-compatibility options for existing topics

Minimal example:

```json
{
  "renderer": "html/default-v2"
}
```

## Renderer Profiles

| Renderer             | Template                                  | When to use it                                       | Default behavior                                                                                                    |
| -------------------- | ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `html/default-v2`    | `renderers/html/default-v2/template.html` | Recommended default for all new topics               | Inherits v1 defaults and enables inline tooltips, expert toggle, version watermark, feedback UI, and mobile card UI |
| `html/default-v1`    | `renderers/html/default-v1/template.html` | Existing topics that must stay on the older shell    | Docs section, docs button, copy-link button, and contact section enabled                                            |
| `html/copy-first-v1` | `renderers/html/default-v1/template.html` | Existing copy-heavy topics that must stay on v1      | Hides docs section, docs button, and copy-link button                                                               |
| `html/reference-v1`  | `renderers/html/default-v1/template.html` | Existing reference-style topics that must stay on v1 | Shares the v1 defaults without copy-first reductions                                                                |

## render.json Format

Place `render.json` next to a topic `spec.md` file.

```json
{
  "renderer": "html/default-v2",
  "options": {
    "showDocsSection": true,
    "showDocsButton": true,
    "showCopyLinkButton": true,
    "showContactSection": true,
    "enableInlineTooltips": true,
    "enableExpertToggle": true,
    "enableVersionWatermark": true,
    "enableFeedback": true,
    "enableMobileCardUi": true
  }
}
```

Rules:

- `renderer` must be one of the registered renderer IDs.
- `options` is optional.
- Any omitted option falls back to the selected renderer defaults.
- Invalid JSON or invalid option types fail compilation with `DTB-008`.

## Option Reference

| Option                   | Effect                                               |
| ------------------------ | ---------------------------------------------------- |
| `showDocsSection`        | Renders the docs block inside result cards           |
| `showDocsButton`         | Shows the docs call-to-action button                 |
| `showCopyLinkButton`     | Shows the deep-link copy button                      |
| `showContactSection`     | Renders the contact section                          |
| `enableInlineTooltips`   | Enables tooltip rendering for authored tooltip terms |
| `enableExpertToggle`     | Exposes expert-detail UI in v2                       |
| `enableVersionWatermark` | Shows the compiled version watermark in v2           |
| `enableFeedback`         | Enables feedback affordances in v2                   |
| `enableMobileCardUi`     | Uses the v2 mobile-oriented card treatment           |

## Migration From v1 to v2

Use this path when moving a topic forward:

1. Add a topic-level `render.json` with `"renderer": "html/default-v2"`.
2. Recompile and verify the topic under `output/`.
3. If the topic uses tooltips or expert detail, confirm those authored fields render correctly in v2.
4. Keep `spec.md` unchanged unless the topic needs v2-only authored content. Renderer selection should stay a configuration change, not a compiler fork.

If you are creating a new topic, skip the v1 profiles and start with `html/default-v2`. Use `html/copy-first-v1`, `html/default-v1`, or `html/reference-v1` only when an existing topic must preserve older output behavior.
