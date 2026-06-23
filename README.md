# Skills Connect — Pathways to Work Quiz

A lightweight, accessible pop-quiz widget for the [Skills Connect](https://www.skillsconnect.org.uk) site. It asks six short questions and uses a weighted-scoring system to suggest the most relevant pathway(s) to work for the user.

## What it does

Users are walked through six questions covering their priorities, attitude to study, support needs, and income timeline. Each answer carries weights that accumulate against nine possible outcomes. At the end the quiz surfaces the top-scoring route (and a second if the scores are close), with a short explanation and links to the relevant Skills Connect pages.

### Possible outcomes

| Outcome | Description |
|---|---|
| Direct employment | Entry-level jobs to build experience straight away |
| Apprenticeships | Earn-and-learn with a structured qualification |
| Pre-employment programmes | Short confidence/CV/interview programmes as a stepping stone |
| Supported internships | Work placements with job-coach support for young people with additional needs |
| College or further training | Vocational qualifications with a clear route into work |
| Work experience & volunteering | Unpaid but CV-building placements |
| Graduate schemes / higher-level routes | University and post-degree pathways |
| Self-employment / starting a business | Freelance or startup routes with mentoring and funding schemes |
| Employment support services | Tailored advice from Jobcentre Plus, Youth Hubs, and Skills Connect |

## File structure

```
quiz/
├── index.html   # Shell page — mounts the quiz root div
├── script.js    # All quiz logic, questions, outcomes, and rendering
└── styles.css   # Scoped BEM-style CSS using Skills Connect brand tokens
```

No build step, no dependencies, no frameworks — plain HTML, CSS, and JavaScript.

## How the scoring works

Each answer carries a `weights` map, e.g.:

```js
{ label: "Getting paid soon", weights: { direct_employment: 2, apprenticeships: 2 } }
```

At the end of the quiz the weights from every answered question are summed per outcome. The highest-scoring outcome is shown as the primary recommendation. If the second-highest is within two points of the top, it is shown alongside as a near-match.

Skipped questions and "Not sure" answers contribute zero weight to any outcome.

## Questions

| # | Question |
|---|---|
| Q1 | What matters most right now? |
| Q2 | How do you feel about studying in the next 6–12 months? |
| Q3 | What kind of help would be most useful? |
| Q4 | How soon do you need income? |
| Q5 | Do you have an EHCP or think you may need workplace support? |
| Q6 | Which sounds closest to you? |

Every question also gets a "Not sure" option added automatically in the UI, and users can skip any question entirely.

## Accessibility

- `aria-live="polite"` on the card region announces step changes to screen readers
- Each question heading has an `id` linked from radio inputs via `aria-labelledby`
- Keyboard users can press Enter to advance once an answer is selected
- Focus-visible outlines use a high-contrast yellow token (`--focus`)
- `<noscript>` fallback lists all pathway links for users without JavaScript
- Respects `prefers-reduced-motion` — all transitions are disabled when set

## Analytics

The widget fires `gtag` events if Google Analytics is present on the host page. Events sent:

| Event | When |
|---|---|
| `quiz_start` | Widget initialises |
| `quiz_answer` | User selects an answer |
| `quiz_not_sure` | User selects "Not sure" |
| `quiz_skip` | User skips a question |
| `quiz_complete` | Results are shown (includes top/second outcome) |
| `quiz_read_all_click` | User clicks the "Read about all your options" link |
| `quiz_restart` | User clicks "Start again" |

All events include `quiz_id: "skillsconnect-pathways-v1"`. The analytics calls are wrapped in a try/catch so the quiz degrades gracefully if GA is absent.

## Embedding

The quiz is designed to drop into an existing Skills Connect page. Include the stylesheet and script, and add the mount point:

```html
<div id="quiz-root" class="sc-quiz" data-quiz-id="skillsconnect-pathways-v1"></div>
<script src="script.js" defer></script>
```

The `data-quiz-id` attribute is passed through to analytics events; change it if you deploy a variant.

## Extending

**Adding a question** — append an object to the `QUESTIONS` array in `script.js` following the existing shape. Weights must reference keys from the `OUTCOMES` object.

**Adding an outcome** — add a key to `OUTCOMES` with `title`, `summary`, `links`, and `accent` (a CSS custom property from `styles.css`), then reference it in answer weights.

**Changing links** — each outcome has a `links` array of `{ text, href }` objects. Set it to `[]` to show no links for that outcome.
