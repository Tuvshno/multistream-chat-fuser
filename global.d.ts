// In a global.d.ts file
export { };

interface Emote {
  data: string; // Base64 encoded image data
  name: string; // File name without the .webp extension
}


declare global {
  interface Window {
    electronAPI: {
      setup: () => Promise<boolean>;
      startServer: () => Promise<void>;
      closeServer: () => Promise<void>;
      center: () => Promise<void>;

      getSetupWindowSize: () => Promise<{ width, height }>;
      getChatWindowSize: () => Promise<{ width, height }>;
      getFontSize: () => Promise<number>;
      getEmoteUrls: () => Promise<string[]>;
      getEmoteFiles: () => Promise<Emote[]>;
      getEmotesJSON: () => Promise<Emote[]>;

      changeSetupWindowSize: () => Promise<>;
      changeChatWindowSize: () => Promise<>;

      setSetup: (boolSetup: boolean) => Promise<void>;
      setEmotesReady: (isReady: boolean) => Promise<void>,
      setWindowSize: (width: number, height: number) => Promise<void>;

      saveURLS: (urls: string[]) => Promise<void>;
      saveEmoteURLS: (urls: string[]) => Promise<void>;
      saveFontSize: (fontSize: number) => Promise<void>;
      savePlatformIconsEnabled: (isEnabled: boolean) => Promise<void>;
      saveBadgesEnabled: (isEnabled: boolean) => Promise<void>;
      saveToolbarEnabled: (isEnabled: boolean) => Promise<void>;
      saveTimestampsEnabled: (isEnabled: boolean) => Promise<void>;

      getUrls: () => Promise<string[]>;
      getEmotesFromURL: (url: string) => Promise<void>;
      getPlatformIconsEnabled: () => Promise<boolean>;
      getBadgesEnabled: () => Promise<boolean>;
      getToolbarEnabled: () => Promise<boolean>;
      getTimestampsEnabled: () => Promise<boolean>;

      checkEmotesReady: () => Promise<boolean>;

      openSettingsWindow: () => Promise<void>;
      openTutorial: () => Promise<void>;
      openEmoteTutorial: () => Promise<void>;

      onSetupUpdated: (func: (updatedSetup: boolean) => void) => void;
      onEmoteDownloadUpdate: (callback: (value: boolean) => void) => void;
      removeSetupUpdatedListener: (func: (updatedSetup: boolean) => void) => void;

      loginWithTwitch: () => Promise<void>;
      loginWithYouTube: () => Promise<void>;
      isTwitchLoggedIn: () => Promise<boolean>;


      // ... any other methods you have
    };
  }
}
