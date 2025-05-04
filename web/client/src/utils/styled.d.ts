import 'styled-components';

// Extend the DefaultTheme in styled-components to include our theme properties
declare module 'styled-components' {
    export interface DefaultTheme {
        bg: string;
        bgLight: string;
        text: string;
        textSoft: string;
        soft: string;
        primary: string;
        [key: string]: string;
    }
} 