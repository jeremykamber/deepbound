export interface BrowserServicePort {
    /**
     * Navigates to a URL and captures the visual state.
     * Useful for the initial "scan" of a pricing page.
     * @returns Base64 encoded JPEG string
     */
    captureScreenshot(url: string, onProgress?: (status: 'SETTING_UP' | 'LOADING_WEBSITE' | 'PROCESSING') => void): Promise<string>;

    /**
     * Specialized methods for granular control during "scouting" (Phase 2).
     */
    navigateTo(url: string, onProgress?: (status: 'SETTING_UP' | 'LOADING_WEBSITE') => void, onLiveScreenshot?: (screenshotBase64: string) => Promise<void>): Promise<void>;
    scrollDown(pixels: number): Promise<void>;
    captureViewport(): Promise<string>;
    captureFullPage(): Promise<string>;
    getCleanedHtml(): Promise<string>;
    close(): Promise<void>;
}
