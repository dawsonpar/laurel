"""Prompt assembly for the Gemini synthesis step.

Centralized so the system prompt and conditional-phrasing rules are enforced
in one place. Acceptance criterion: every generated explanation must use
conditional phrasing and never claim outcome guarantees.
"""

from __future__ import annotations

from app.kb.retrieval import RetrievedChunk

SYSTEM_PROMPT = """You are Laurel, a friendly Olympic and Paralympic explainer for casual TV viewers.

Your job is to answer "what just happened?" or "is this a big deal?" using:
1. A short summary of what was visually identified in the captured frame.
2. Curated knowledge-base context about the sport.
3. The viewer's question (if asked).

RULES, FOLLOW EVERY ONE:
- Use conditional phrasing for any forward-looking or uncertain claim. Examples: "could be considered", "is widely regarded", "might suggest". Never guarantee outcomes.
- Be accurate. If the knowledge base does not cover a claim, say so plainly rather than inventing.
- Treat Olympic and Paralympic sports as equally important. Do not frame Paralympic sports as exceptional or inspirational; frame them as athletic events with their own rules and records.
- Do not name living athletes by their full name unless they appear in the provided knowledge-base context.
- Be specific. Reference rules by name when relevant ("under the lane-violation rule", "by the free guard zone rule").
- Keep your answer to 3-6 sentences unless the question demands more depth.
- Never use em-dashes or en-dashes. Use periods, commas, parentheses, or colons instead.

Respond as plain text. No markdown headers."""


def build_explain_prompt(
    moment_summary: str,
    sport_name: str | None,
    retrieved: list[RetrievedChunk],
    user_question: str | None = None,
) -> str:
    """Assemble the full prompt for the synthesis step."""
    sport_hint = sport_name or "Unknown (vision could not match a curated sport)"
    question = user_question or (
        "Explain what just happened. If a rule was likely applied, name the rule. "
        "If it might be a notable moment, say why it could matter."
    )

    context_blocks = "\n\n".join(
        f"[{chunk.chunk.sport_slug} / {chunk.chunk.section}]\n{chunk.chunk.text}"
        for chunk in retrieved
    )
    if not context_blocks:
        context_blocks = "(No knowledge-base context retrieved.)"

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"## Captured moment\n"
        f"Sport (vision-identified): {sport_hint}\n"
        f"Visual summary: {moment_summary}\n\n"
        f"## Viewer question\n{question}\n\n"
        f"## Knowledge-base context\n{context_blocks}\n\n"
        f"## Your answer"
    )


def build_followup_prompt(
    sport_name: str | None,
    moment_summary: str,
    history: list[dict[str, str]],
    new_question: str,
    retrieved: list[RetrievedChunk],
) -> str:
    """Assemble a prompt for a conversational follow-up against an existing moment."""
    sport_hint = sport_name or "Unknown"
    history_block = "\n".join(f"{turn['role'].upper()}: {turn['content']}" for turn in history)
    if not history_block:
        history_block = "(No prior turns.)"

    context_blocks = (
        "\n\n".join(
            f"[{chunk.chunk.sport_slug} / {chunk.chunk.section}]\n{chunk.chunk.text}"
            for chunk in retrieved
        )
        or "(No new knowledge-base context retrieved.)"
    )

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"## Original moment\n"
        f"Sport: {sport_hint}\n"
        f"Visual summary: {moment_summary}\n\n"
        f"## Conversation so far\n{history_block}\n\n"
        f"## New question\n{new_question}\n\n"
        f"## Additional context\n{context_blocks}\n\n"
        f"## Your answer"
    )
