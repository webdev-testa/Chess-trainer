---
version: alpha
name: Linear-chess-trainer-design-system
description: "A near-black product-focused canvas built around #010102 (the deepest dark surface), light gray text (#f7f8f8), and the signature Linear lavender-blue (#5e6ad2) used as the single chromatic accent. The system reads as grandmaster software-craft: dense, technical, and quietly luxurious. Surfaces live as charcoal panels (#0f1011) with hairline borders (#23252a). The accent lavender appears on focus rings, active states, and intentional CTAs. Page rhythm leans on the interactive chessboard framed in dark panels with precision typography."

colors:
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  surface-4: "#191a1b"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  hairline-tertiary: "#3e3e44"
  semantic-success: "#27a644"
  semantic-danger: "#eb5757"
  semantic-warning: "#f2994a"

typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.5px
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.05px
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
  status-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

## Overview

Chess Trainer's design language follows the **Linear.app** design ethos: an obsidian near-black environment (`#010102`) engineered for intense cognitive focus, tactical clarity, and grandmaster-grade analytical density.

The interface prioritizes high signal-to-noise ratio:
- Deep obsidian backdrop makes the chess pieces and board squares visually vivid without eye strain.
- Linear's signature lavender-indigo (`#5e6ad2`) serves as the active brand voltage.
- Precision mono typography (`ui-monospace`) for move notations, FEN strings, ECO codes, and Stockfish evaluations.
- Hairline 1px borders (`#23252a`) define panels and cards with refined elevation.
