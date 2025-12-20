export interface LocalStoreState {
  count: number;
  preferredCurrency: string;
  preferredLanguage: string;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setPreferredCurrency: (currency: string) => void;
  setPreferredLanguage: (language: string) => void;
}

export interface SessionStoreState {
  text: string;
  setText: (text: string) => void;
  clear: () => void;
}
