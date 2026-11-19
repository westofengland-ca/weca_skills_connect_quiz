# Youth Guarantee quiz

A 2-question quiz for the [Youth Guarantee page on Skills Connect](https://www.skillsconnect.org.uk/youth-guarantee/). It asks a young person's age and where they live, then lists the Youth Guarantee projects they can apply to.

Live URL: https://westofengland-ca.github.io/weca_skills_connect_quiz/youth-guarantee/

## Routes

| Age | Second question | Result |
|---|---|---|
| Under 16 or 22 or over | What do you need support with? | Skills Connect directory or contact form |
| 16 or 17, or 18 to 21 | Where do you live? | Projects for that area and age, from `programmes.json` |
| 16 to 21, living somewhere else | Where do you live? | National Careers Service |

If no projects match, or `programmes.json` fails to load, the quiz shows a link to Skills Connect support instead of an empty page.

## Files

```
youth-guarantee/
├── index.html          # Page shell and no-JavaScript fallback
├── script.js           # Questions, routing, results, analytics
├── styles.css          # Styles, using Skills Connect tokens
├── programmes.json     # The project list - edit this to change results
└── embed-snippet.html  # Paste into a Custom HTML block on Skills Connect
```

## Updating projects

Edit `programmes.json` in the GitHub web editor. Each project looks like this:

```json
{
  "id": "future-ready",
  "name": "Future Ready",
  "summary": "What the project offers.",
  "who_for": "Who can apply, in plain words.",
  "areas": ["banes"],
  "age_min": 18,
  "age_max": 21,
  "apply_url": "mailto:Futureready@alongsidecharity.org.uk",
  "apply_label": "Email to apply for Future Ready"
}
```

- `areas` uses these values: `bristol`, `banes`, `north-somerset`, `south-glos`
- a project shows for an age band only if the whole band fits inside `age_min` to `age_max`. For example, `age_min: 18` hides it from 16 and 17 year olds
- `id` is sent to Google Analytics when someone clicks the apply link, so keep it the same once live
- to remove a project, delete its whole entry, including the curly brackets and the comma before or after it
- projects for one area are listed before projects covering several areas

Changes go live within about 10 minutes of committing. After an edit, run through the quiz once for the area you changed.

If the file has a syntax error (for example a missing comma), the quiz shows a link to the Youth Guarantee page instead of results. Paste the file into a JSON validator before committing if you are unsure.

## Eligibility

The quiz only asks age and area. It does not ask about care experience, SEND or mental health. Projects with extra criteria say so in `who_for`, and the young person decides whether to apply.

## Embedding

Paste the contents of `embed-snippet.html` into one Custom HTML block on the Skills Connect page. Check that the block keeps the `<script>` tag after saving.

When embedded, the quiz:

- hides its own heading, so the page heading is used
- resizes the iframe to fit its content
- opens Skills Connect links in the same tab and other sites in a new tab

## Analytics

The quiz runs on github.io, so it cannot see the Skills Connect Google Analytics tag. It sends events to the host page with `postMessage`, and the script in `embed-snippet.html` passes them to `gtag` (or `dataLayer` if the site uses Google Tag Manager). Messages are only sent to `skillsconnect.org.uk`.

| Event | When | Parameters |
|---|---|---|
| `quiz_start` | First answer submitted | |
| `quiz_answer` | Each answer submitted | `question_id`, `answer` |
| `quiz_back` | Back button | |
| `quiz_complete` | Result shown | `outcome`, `age_band`, `area`, `result_count` |
| `quiz_link_click` | Result link clicked | `link_type`, `programme_id` |
| `quiz_restart` | Start again | |

All events include `quiz_id: "yg-quiz-v1"`. `outcome` is one of `programmes`, `directory`, `contact`, `ncs`, `none` or `error`.

To report on parameters in GA4, register them as event-scoped custom dimensions.

## Accessibility

- each question is a `fieldset` with the question as its `legend`
- an error message shows if someone continues without choosing, instead of a disabled button
- focus moves to the new question or result heading after each step, but not on page load, so the embed does not pull the page down
- Enter submits the current question
- links that open a new tab say so to screen readers
