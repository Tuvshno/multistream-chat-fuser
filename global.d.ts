// In a global.d.ts file
export { };

declare global {
  interface Window {
    electronAPI: {
      setup: () => Promise<boolean>;
      setSetup: (boolSetup: boolean) => Promise<void>;
      saveURLS: (urls: string[]) => Promise<void>;
      getUrls: () => Promise<string[]>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      startServer: () => Promise<void>;

      // ... any other methods you have
    };
  }
}
