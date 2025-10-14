import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
    // Ocean theme
    ".ocean": {
      // backgroundColor: "#e0f2f7",
      backgroundColor: "#272936",
      color: "#01579b",
      "--colors-bg-canvas": "#e0f2f7",
      "--colors-bg-surface": "#b3e5fc",
      "--colors-bg-subtle": "#81d4fa",
      "--colors-bg-muted": "#4fc3f7",
      "--colors-ui-main": "#0288d1",
      "--colors-fg-default": "#01579b",
      "--colors-fg-muted": "#0277bd",
      "--colors-border-default": "#4fc3f7",
    },
    ".ocean input, .ocean textarea, .ocean select": {
      // backgroundColor: "#ffffff",
      backgroundColor: "#272936",
      borderColor: "#4fc3f7",
    },
    ".ocean a": {
      color: "#0277bd",
    },
    // Forest theme
    ".forest": {
      backgroundColor: "#e8f5e9",
      color: "#1b5e20",
      "--colors-bg-canvas": "#e8f5e9",
      "--colors-bg-surface": "#c8e6c9",
      "--colors-bg-subtle": "#a5d6a7",
      "--colors-bg-muted": "#81c784",
      "--colors-ui-main": "#43a047",
      "--colors-fg-default": "#1b5e20",
      "--colors-fg-muted": "#2e7d32",
      "--colors-border-default": "#81c784",
    },
    ".forest input, .forest textarea, .forest select": {
      backgroundColor: "#ffffff",
      borderColor: "#81c784",
    },
    ".forest a": {
      color: "#2e7d32",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#009688" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})