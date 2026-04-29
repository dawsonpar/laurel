# ADR-0002: Visual feedback during capture

**Status:** Accepted
**Date:** 2026-04-28
**Deciders:** Dawson Par + agent

## Context

When a user captures a frame, we need to communicate that "Laurel sees this and is thinking." The clicky reference (`farzaa/clicky`) uses bounding-box overlays drawn on the screen at the spots Claude's response references.

## Decision

Use an **animated glowing outline around the entire capture viewport**, not bounding boxes inside the captured frame.

The CSS uses keyframe animation on `box-shadow` to pulse a subtle accent-colored glow around the frame container.

## Rationale

- Gemini Vision can return bounding-box coordinates, but reliability on busy sports footage (motion blur, multiple subjects, glare from a TV) is unproven. Spending Day 1-2 of the sprint on a feature that may not land is high risk.
- The whole-frame outline is unmistakable, animation timing is fully under our control, and the implementation is pure CSS.
- The "clicky" magic is the responsiveness of the AI explanation, not the precision of the pointer. We retain that magic.

## Rejected alternatives

- **Bounding boxes from Gemini Vision coordinates.** See above. Could revisit in v2 once Gemini's coordinate quality is benchmarked on our specific input distribution.
- **Static border, no animation.** Too quiet. Doesn't signal "thinking happening."

## Consequences

- We do not need Gemini to return structured coordinate data, simplifying the prompt.
- Future v2 may add region annotation when we have time to test reliability.
