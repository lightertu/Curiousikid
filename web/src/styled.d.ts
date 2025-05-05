import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string;
    bgLight: string;
    primary: string;
    text_primary: string;
    text_secondary: string;
    card: string;
    button: string;
    text?: string;
    textSoft?: string;
    soft?: string;
  }
}

declare module 'react' {
  interface HTMLAttributes<T> {
    button?: boolean;
    activeButton?: boolean;
    googleButton?: any;
    box?: boolean;
    error?: string;
  }

  interface LabelHTMLAttributes<T> {
    for?: string;
  }
} 