import { Platform } from '../types/search';

export type AuthStackParamList = {
  Login: undefined;
};

export type RootStackParamList = {
  Capture: undefined;
  Label: undefined;
  Info: undefined;
  Player: { url: string; title: string; platform: Platform };
};
