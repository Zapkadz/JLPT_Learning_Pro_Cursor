---
version: alpha
colors:
  primary: "#087c5b"
  background: "#f8fafb"
  surface: "#ffffff"
  text: "#101a32"
  muted: "#64748b"
  border: "#e4eaf0"
  mint: "#e7f7ef"
  danger: "#b42335"
typography:
  sans:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "15px"
    lineHeight: "1.65"
  japanese:
    fontFamily: "Yu Gothic, Meiryo, Noto Sans JP, sans-serif"
    lineHeight: "1.9"
rounded:
  panel: "12px"
  control: "8px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  button:
    height: "44px"
    rounded: "8px"
---

# Kotoba Design System

## North Star

A calm Vietnamese study desk: the next useful learning action is always obvious. Primary reference: docs/design-concept.png generated with built-in ImageGen; the prompt specified a complete Vietnamese dashboard, emerald accent, neutral background, sidebar, daily review banner, real zero metrics, starter lists and activity heatmap.

## Context

Vietnamese learners of Japanese, personal study, desktop/tablet/mobile. Vietnamese navigation and messages; Japanese learning content uses lang=ja and readable line spacing. No Japan-market commercial assumptions.

## Visual Direction

Reference-locked white surfaces, cool near-white canvas, emerald primary, navy ink, mint focus banner. Airy but useful density, thin borders, restrained rounded corners. No marketing hero, fake progress, stock images or decorative badges.

## Tokens

Runtime owner src/styles.css :root. --bg #f8fafb; --surface #ffffff; --ink #101a32; --muted #64748b; --line #e4eaf0; --brand #087c5b; --mint #e7f7ef; --danger #b42335; radius 12px; spacing 4/8/12/16/24/32; sidebar 238px; content max 1360px.

## Typography

System sans-serif for Vietnamese, Yu Gothic/Meiryo/Noto Sans JP fallback for Japanese. Body 15px/1.65; h1 30px/1.25; h2 20px/1.4; learning prompt 30px/1.9. No remote font dependency. Buttons inherit typography.

## Components

AppShell owns sidebar and header. PageHead, Button/link classes, Field, Status, Empty, Heatmap, Stat and native dialog are shared. Lucide icons 20px, 1.8 stroke. Green primary, neutral outlined secondary, red only destructive/error. Panels radius 12; deck lists are rows. Native select popup appearance belongs to OS.

## Layout & Responsive

Desktop sidebar + natural document scroller. At 1000px content grids collapse where required. At 700px sidebar becomes top brand and horizontal navigation, all content single column. Heatmap independently horizontally scrollable; forms never clipped. Touch targets min 44px.

## Motion & Accessibility

120ms color/opacity transitions only, reduced-motion disables transitions. Visible 3px focus, native buttons and links, text status live region, dialogs use showModal with focus restoration. Scrollbar baseline standards + WebKit + forced-colors. No color-only results.

## Behavior & Ownership

UX-CONTRACT.md is authoritative. Data metrics are real and zero for a new user. Learning progress never means official JLPT proficiency. Empty/retry/validation feedback is in the same flow. Auth required for personal data; no seeded shared user.

## Verification

Typecheck/build, domain tests, API isolation and duplicate review tests, browser create/import/review/quiz/settings/mobile flows. See tests and README.md for validation commands and scope.

## Grammar N2 module

Keep Kotoba mint/white palette and existing navigation. Course uses numbered lesson rows, pending content is readable with “Đang biên soạn”. Pattern detail uses a two-column information layout, contrast note and Japanese example with stable ruby space. Exercises have three real tabs with arrow-key navigation, persistent card components across tabs, four accessible click-to-place tokens, and server results. Translation mismatch means needs review, never automatic wrong. Current scope: lesson1,5 patterns,150 original exercises; future141/4,230 is a target, never a fake completed count.
