"""Token-pacing helper for streaming responses.

Vertex AI Gemini streams in sentence-sized chunks (~50-100 words at a time)
which arrive in 1-2 seconds total. The user perceives that as one block, not
streaming. We sub-stream each chunk word-by-word with a small delay so the
client sees the typewriter cadence Gemini-style apps are expected to have.

The pacing only affects perceived latency; total response time grows by at
most `pace_ms * total_words / 1000` seconds. At 25ms per word, a 120-word
response takes ~3s of paced streaming, which feels right for a reading-pace
explanation.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator


async def pace_tokens(
    source: AsyncIterator[str],
    pace_ms: int = 25,
) -> AsyncIterator[str]:
    """Re-emit a stream of text chunks word-by-word with a small delay between words.

    Whitespace is preserved on the trailing edge of each word so concatenating
    the emitted pieces reconstructs the original chunk.
    """
    delay = pace_ms / 1000
    async for chunk in source:
        if not chunk:
            continue
        words = chunk.split(" ")
        for i, word in enumerate(words):
            text = word + (" " if i < len(words) - 1 else "")
            if not text:
                continue
            yield text
            await asyncio.sleep(delay)
