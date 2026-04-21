# La Promesa Devuelta — Style Guide
*Component reference for consistent UI development.*

---

## Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0d0d0d` | Page background |
| `surface` | `#111010` | Cards, containers |
| `surface-raised` | `#161412` | Inset sections, input backgrounds |
| `border` | `#2a2520` | All borders and dividers |
| `gold` | `#c4a96a` | Primary accent — CTAs, highlights, links |
| `gold-hover` | `#d4b97a` | Button hover state |
| `gold-muted` | `#8a7355` | Disabled states, secondary labels |
| `text-primary` | `#e8e0d0` | Headings, high-emphasis text |
| `text-body` | `#a09080` | Body copy |
| `text-secondary` | `#d4c9b5` | Medium-emphasis text |
| `text-muted` | `#6a5f50` | Labels, captions, metadata |
| `text-ghost` | `#3a3028` | Footer text, legal |
| `error` | `#c0392b` | Error messages |

---

## Typography

### Fonts
- **Display / Body:** `Georgia, 'Times New Roman', serif` — headings, paragraphs, quotes
- **UI / Labels:** `'Helvetica Neue', Arial, sans-serif` — buttons, labels, tags, captions

### Scale

| Role | Font | Size | Weight | Tracking | Transform |
|---|---|---|---|---|---|
| Page title | serif | 32–64px | 600 | -0.01em | — |
| Section heading | serif | 20–28px | 600 | — | — |
| UI heading | sans-serif | 16px | 700 | 0.15em | uppercase |
| Body | serif | 16–18px | 400 | — | — |
| Label / tag | sans-serif | 9–11px | 700 | 0.25–0.35em | uppercase |
| Caption | sans-serif | 10–12px | 400 | 0.05em | — |
| Footer | sans-serif | 10–11px | 400 | 0.05em | — |

---

## Buttons

### Primary CTA
```tsx
style={{
  backgroundColor: "#c4a96a",
  color: "#0d0d0d",
  padding: "14px 36px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: 700,
  fontSize: "10px",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  border: "none",
  borderRadius: 0,          // always sharp corners
  cursor: "pointer",
  transition: "background-color 0.3s",
}}
// hover → backgroundColor: "#d4b97a"
// disabled → backgroundColor: "#8a7355", opacity: 0.6
```

### Secondary / Ghost
```tsx
style={{
  backgroundColor: "transparent",
  color: "#6a5f50",
  padding: "14px 36px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: 700,
  fontSize: "10px",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  border: "1px solid #2a2520",
  borderRadius: 0,
  cursor: "pointer",
  transition: "border-color 0.3s, color 0.3s",
}}
// hover → borderColor: "#c4a96a", color: "#c4a96a"
```

**Rules:**
- `borderRadius` is always `0` — no rounded corners anywhere
- No gradients on buttons
- No `transform: translateY` hover effects
- Loading state: change color, not opacity alone

---

## Borders & Dividers

```tsx
border: "1px solid #2a2520"        // standard container border
borderLeft: "3px solid #c4a96a"    // accent / highlight border (quote blocks, wallet box)
borderBottom: "1px solid #2a2520"  // section dividers
```

---

## Containers & Spacing

```tsx
// Page content
padding: "36px 48px"     // desktop sections
padding: "28px 48px"     // footer / compact sections

// Cards / boxes
backgroundColor: "#161412"
border: "1px solid #2a2520"
padding: "20px 24px"

// Inset / highlighted box (wallet, quote)
backgroundColor: "#161412"
borderLeft: "3px solid #c4a96a"
padding: "16px 20px"
```

**Rules:**
- No `borderRadius` on containers — all boxes are sharp
- No `boxShadow` — depth is created through background color contrast, not shadows

---

## Form Inputs

```tsx
style={{
  backgroundColor: "#161412",
  border: "none",
  borderBottom: "2px solid #2a2520",
  color: "#e8e0d0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "16px",
  padding: "12px 0",
  width: "100%",
  outline: "none",
}}
// focus → borderBottomColor: "#c4a96a"
// placeholder color → "#6a5f50"
```

---

## Labels & Tags

```tsx
// Section label (above a heading)
style={{
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: "#8a7355",
}}

// Badge / pill
style={{
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "#0d0d0d",
  backgroundColor: "#c4a96a",
  padding: "4px 12px",
}}
```

---

## Quote Blocks

```tsx
// Container
style={{
  borderLeft: "3px solid #c4a96a",
  backgroundColor: "#0d0d0d",
  padding: "24px 28px",
  margin: "32px 0",
}}

// Quote text
style={{
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "18px",
  fontStyle: "italic",
  lineHeight: 1.65,
  color: "#c4a96a",
}}
```

---

## Error & Status Messages

```tsx
// Error
style={{
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.05em",
  color: "#c0392b",
}}

// Muted helper text
style={{
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#6a5f50",
  textAlign: "center",
}}
```

---

## Motion

- Transitions: `0.3s` on color/background, `0.5s` on opacity
- No `transform: translateY` hover lifts
- No entrance animations on functional components (forms, buttons)
- Page-level reveals: `opacity` + `translateY` staggered, reserved for hero sections only

---

## Rules Summary

1. **No rounded corners** — `borderRadius: 0` everywhere
2. **No gradients** — solid colors only
3. **No shadows** — depth through background contrast
4. **No hover lifts** — color transitions only
5. **Serif for content, sans-serif for UI** — never mix within the same element
6. **Gold (`#c4a96a`) is the only accent** — use sparingly, only for primary actions and highlights
7. **All labels uppercase** — with generous letter-spacing (0.25em minimum)
8. **Dark backgrounds only** — no light mode components