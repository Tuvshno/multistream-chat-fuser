// In a global.d.ts file
export { };

declare global {
  interface Window {
    electronAPI: {
      setup: () => Promise<boolean>;
      getSetupWindowSize: () => Promise<{ width, height }>;
      getChatWindowSize: () => Promise<{ width, height }>;
      changeSetupWindowSize: () => Promise<>;
      changeChatWindowSize: () => Promise<>;
      setSetup: (boolSetup: boolean) => Promise<void>;
      saveURLS: (urls: string[]) => Promise<void>;
      saveEmoteURLS: (urls: string[]) => Promise<void>;
      saveFontSize: (fontSize: number) => Promise<void>;
      getFontSize: () => Promise<number>;
      getUrls: () => Promise<string[]>;
      getEmoteUrls: () => Promise<string[]>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      startServer: () => Promise<void>;
      openSettingsWindow: () => Promise<void>;
      onSetupUpdated: (func: (updatedSetup: boolean) => void) => void;
      removeSetupUpdatedListener: (func: (updatedSetup: boolean) => void) => void;
      loginWithTwitch: () => Promise<void>;
      loginWithYouTube: () => Promise<void>;
      closeServer: () => Promise<void>;
      isTwitchLoggedIn: () => Promise<boolean>;
      savePlatformIconsEnabled: (isEnabled: boolean) => Promise<void>;
      saveBadgesEnabled: (isEnabled: boolean) => Promise<void>;
      saveToolbarEnabled: (isEnabled: boolean) => Promise<void>;
      getPlatformIconsEnabled: () => Promise<boolean>;
      getBadgesEnabled: () => Promise<boolean>;
      getToolbarEnabled: () => Promise<boolean>;
      center: () => Promise<void>;
      openTutorial: () => Promise<void>;
      getEmotesFromURL: (url: string) => Promise<void>;

      // ... any other methods you have
    };
  }
}
