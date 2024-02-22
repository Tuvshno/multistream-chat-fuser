// In a global.d.ts file
export { };

declare global {
  interface Window {
    electronAPI: {
      setup: () => Promise<boolean>;
      setSetup: (boolSetup: boolean) => Promise<void>;
      saveURLS: (urls: string[]) => Promise<void>;
      saveFontSize: (fontSize: number) => Promise<void>;
      getFontSize: () => Promise<number>;
      getUrls: () => Promise<string[]>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      startServer: () => Promise<void>;
      openSettingsWindow: () => Promise<void>;
      onSetupUpdated: (func: (updatedSetup: boolean) => void) => void;
      removeSetupUpdatedListener: (func: (updatedSetup: boolean) => void) => void;
      loginWithTwitch: () => Promise<void>;
      loginWithYouTube: () => Promise<void>;
      closeServer: () => Promise<void>;

      
      // ... any other methods you have
    };
  }
}
