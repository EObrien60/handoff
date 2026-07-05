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
export declare const defaultTheme: HandoffTheme;
export declare function withTheme(overrides?: Partial<HandoffTheme>): HandoffTheme;
