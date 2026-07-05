/** Visual theme for SDK components. Override `accent` to match the host app. */
export interface HandoffTheme {
  accent: string;
  accentContrast: string;
  ink: string;
  muted: string;
  faint: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  radius: number;
  fontFamily: string;
}

export const defaultTheme: HandoffTheme = {
  accent: "#0d5c4f",
  accentContrast: "#ffffff",
  ink: "#1c1a17",
  muted: "#6b6459",
  faint: "#9a9285",
  surface: "#ffffff",
  surfaceAlt: "#f5f3ee",
  line: "#e6e1d6",
  radius: 10,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};

export function withTheme(overrides?: Partial<HandoffTheme>): HandoffTheme {
  return { ...defaultTheme, ...overrides };
}
