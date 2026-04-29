# Laurel

Olympic and Paralympic moment explainer powered by Gemini.

> Wait, what just happened? Point your phone at the TV and find out.

Built for the [Team USA x Google Cloud Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/) under the Choose Your Own Challenge track.

## What it does

Capture a frame from your TV (camera or upload), and Laurel explains what just happened, the rule behind it, and why it matters. Conversational follow-ups via text or voice. Sharable links with rich previews. Olympic and Paralympic content treated as equals (3 sports each in the MVP).

Two demo scenarios drive the design:

- **Scenario A:** Friends watching together, judge ruling negates the highlight, group is confused. One pulls out their phone, opens Laurel, captures the frame, gets a clear rule-based explanation in seconds.
- **Scenario B:** A world record falls. User captures it, asks "Was that a big deal?" Laurel surfaces historical context and prior records, then generates a sharable link to text the family group chat.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4, hosted on Vercel
- **Backend:** Python 3.12, FastAPI, hosted on Google Cloud Run
- **AI:** Gemini 2.5 Flash (Vision + text), Vertex AI text-embedding-005
- **Storage:** Cloud Storage (frames), Cloud Firestore (moment metadata)
- **Voice input:** browser-native Web Speech API

## Repo layout

```
laurel/
  frontend/    # Next.js 16 app
  backend/     # FastAPI service
  backend/kb/  # Curated sport knowledge base (markdown)
  docs/        # Project wiki: ADRs, runbooks, knowledge base
  LICENSE      # Apache 2.0
```

## Getting started

See [docs/runbooks/local-development.md](docs/runbooks/local-development.md) for setup, run, and test instructions.

## MVP sport coverage

Six sports, balanced 3:3 between Olympic and Paralympic:

| Sport | Games | Type |
|---|---|---|
| Figure Skating | Winter | Olympic |
| Curling | Winter | Olympic |
| Athletics | Summer | Olympic |
| Wheelchair Curling | Winter | Paralympic |
| Para Alpine Skiing | Winter | Paralympic |
| Para Athletics | Summer | Paralympic |

## Documentation

The `docs/` folder is a living wiki. Start at [docs/index.md](docs/index.md).

Key references:

- [ADR-0001: Project structure and stack](docs/decisions/adr-0001-project-structure-and-stack.md)
- [Local development runbook](docs/runbooks/local-development.md)
- [Hackathon rules](docs/knowledge-base/hackathon-rules.md)

## License

Apache License 2.0. See [LICENSE](LICENSE).
