/**
 * Inline style objects for the transactional emails.
 *
 * EMAIL CLIENT RULES enforced here - do not relax them:
 * - No flexbox, no grid. Layout is tables only (Section / Row / Column).
 * - No external stylesheet, no <style> block, no web font. Every declaration
 *   below is applied inline by React Email at render time.
 * - System font stack only, so nothing has to be downloaded.
 * - Solid colours only. Gradients silently fall back to nothing in Outlook,
 *   which would leave white text on a white band.
 * - 600px maximum width, centered.
 */

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Also a system stack - no font is fetched. Used for the order reference. */
export const MONO_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const COLORS = {
  pageBg: "#f4f4f5",
  card: "#ffffff",
  headerBg: "#10231a",
  headerInk: "#ffffff",
  headerMuted: "#a7bfb2",
  ink: "#111827",
  muted: "#4b5563",
  rule: "#e5e7eb",
  accent: "#166534",
  accentInk: "#ffffff",
  refBg: "#f0fdf4",
  refBorder: "#bbf7d0",
  refInk: "#052e16",
  proofBg: "#fffbeb",
  proofBorder: "#fde68a",
  proofInk: "#713f12",
  alertBg: "#fef2f2",
  alertBorder: "#b91c1c",
  alertInk: "#7f1d1d",
  panelBg: "#f8fafc",
} as const;

export const body = {
  backgroundColor: COLORS.pageBg,
  fontFamily: FONT_STACK,
  margin: "0",
  padding: "0",
} as const;

export const outer = {
  padding: "24px 12px",
} as const;

export const container = {
  maxWidth: "600px",
  width: "100%",
} as const;

export const card = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.rule}`,
  borderRadius: "8px",
} as const;

export const header = {
  backgroundColor: COLORS.headerBg,
  borderRadius: "8px 8px 0 0",
  padding: "24px 28px",
} as const;

export const wordmark = {
  color: COLORS.headerInk,
  fontFamily: FONT_STACK,
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "2px",
  margin: "0",
} as const;

export const headerTagline = {
  color: COLORS.headerMuted,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "6px 0 0",
} as const;

export const content = {
  padding: "28px",
} as const;

export const h1 = {
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "30px",
  margin: "0 0 14px",
} as const;

export const paragraph = {
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
} as const;

export const smallParagraph = {
  color: COLORS.muted,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 12px",
} as const;

export const label = {
  color: COLORS.muted,
  fontFamily: FONT_STACK,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1px",
  margin: "0 0 4px",
  textTransform: "uppercase",
} as const;

export const value = {
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: "22px",
  margin: "0",
} as const;

/** The reference block. Large, high contrast, generously spaced, selectable. */
export const refPanel = {
  backgroundColor: COLORS.refBg,
  border: `1px solid ${COLORS.refBorder}`,
  borderRadius: "8px",
  margin: "0 0 24px",
  padding: "20px 16px",
} as const;

export const refLabel = {
  color: COLORS.refInk,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  margin: "0 0 10px",
  textAlign: "center",
  textTransform: "uppercase",
} as const;

export const refValue = {
  color: COLORS.refInk,
  fontFamily: MONO_STACK,
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "4px",
  lineHeight: "36px",
  margin: "0",
  textAlign: "center",
  wordBreak: "break-all",
} as const;

export const refHint = {
  color: COLORS.muted,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "10px 0 0",
  textAlign: "center",
} as const;

export const panel = {
  backgroundColor: COLORS.panelBg,
  border: `1px solid ${COLORS.rule}`,
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "18px",
} as const;

export const proofPanel = {
  backgroundColor: COLORS.proofBg,
  border: `1px solid ${COLORS.proofBorder}`,
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "18px",
} as const;

export const proofHeading = {
  color: COLORS.proofInk,
  fontFamily: FONT_STACK,
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "22px",
  margin: "0 0 6px",
} as const;

export const proofNote = {
  color: COLORS.proofInk,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 14px",
} as const;

/** The "reply within 24 hours" band. Never put this in the footer. */
export const alertPanel = {
  backgroundColor: COLORS.alertBg,
  borderLeft: `4px solid ${COLORS.alertBorder}`,
  borderRadius: "4px",
  margin: "0 0 24px",
  padding: "16px 18px",
} as const;

export const alertText = {
  color: COLORS.alertInk,
  fontFamily: FONT_STACK,
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "24px",
  margin: "0",
} as const;

export const button = {
  backgroundColor: COLORS.accent,
  borderRadius: "6px",
  color: COLORS.accentInk,
  display: "inline-block",
  fontFamily: FONT_STACK,
  fontSize: "16px",
  fontWeight: 700,
  padding: "14px 26px",
  textDecoration: "none",
} as const;

export const link = {
  color: COLORS.accent,
  fontFamily: FONT_STACK,
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all",
} as const;

export const footer = {
  borderTop: `1px solid ${COLORS.rule}`,
  padding: "22px 28px 26px",
} as const;

export const footerHeading = {
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: "20px",
  margin: "0 0 10px",
} as const;

export const footerText = {
  color: COLORS.muted,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
} as const;

export const legal = {
  color: COLORS.muted,
  fontFamily: FONT_STACK,
  fontSize: "11px",
  lineHeight: "17px",
  margin: "16px 0 0",
} as const;

export const divider = {
  borderColor: COLORS.rule,
  margin: "20px 0",
} as const;
