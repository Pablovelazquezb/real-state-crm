import { mode } from "@chakra-ui/theme-tools";

/**
 * Nova CRM · sistema visual moderno
 * Paleta slate + índigo, superficies blancas con bordes suaves y sombras discretas.
 */
export const globalStyles = {
  colors: {
    brand: {
      50: "#EEF2FF",
      100: "#E0E7FF",
      200: "#C7D2FE",
      300: "#A5B4FC",
      400: "#818CF8",
      500: "#6366F1",
      600: "#4F46E5",
      700: "#4338CA",
      800: "#3730A3",
      900: "#312E81",
    },
    brandScheme: {
      50: "#EEF2FF",
      100: "#E0E7FF",
      200: "#C7D2FE",
      300: "#A5B4FC",
      400: "#818CF8",
      500: "#6366F1",
      600: "#4F46E5",
      700: "#4338CA",
      800: "#3730A3",
      900: "#312E81",
    },
    brandTabs: {
      50: "#EEF2FF",
      100: "#E0E7FF",
      200: "#C7D2FE",
      300: "#A5B4FC",
      400: "#818CF8",
      500: "#6366F1",
      600: "#4F46E5",
      700: "#4338CA",
      800: "#3730A3",
      900: "#312E81",
    },
    secondaryGray: {
      50: "#FFFFFF",
      100: "#F8FAFC",
      200: "#F1F5F9",
      300: "#F5F7FB",
      400: "#E9EDF4",
      500: "#94A3B8",
      600: "#64748B",
      700: "#475569",
      800: "#334155",
      900: "#0F172A",
    },
    red: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      300: "#FCA5A5",
      500: "#EF4444",
      600: "#DC2626",
    },
    blue: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      500: "#3B82F6",
      600: "#2563EB",
    },
    orange: {
      50: "#FFF7ED",
      100: "#FFEDD5",
      400: "#FB923C",
      500: "#F59E0B",
      600: "#D97706",
    },
    green: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      400: "#34D399",
      500: "#10B981",
      600: "#059669",
    },
    navy: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#111827",
      900: "#0B1220",
    },
    gray: {
      100: "#F8FAFC",
      200: "#F1F5F9",
      300: "#E2E8F0",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        overflowX: "hidden",
        bg: mode("secondaryGray.300", "navy.900")(props),
        color: mode("secondaryGray.900", "white")(props),
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "15px",
        letterSpacing: "-0.01em",
        WebkitFontSmoothing: "antialiased",
      },
      html: {
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      "h1, h2, h3, h4, h5, h6": {
        fontFamily: '"Plus Jakarta Sans", Inter, sans-serif !important',
        letterSpacing: "-0.02em",
      },
      input: {
        color: mode("secondaryGray.900", "white")(props),
      },
      "::selection": {
        background: "brand.200",
      },
      "*::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "*::-webkit-scrollbar-thumb": {
        background: mode("secondaryGray.400", "whiteAlpha.300")(props),
        borderRadius: "full",
      },
      "*::-webkit-scrollbar-track": {
        background: "transparent",
      },
    }),
  },
};
