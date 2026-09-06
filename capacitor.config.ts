import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.matrixlab.app",
  appName: "MatrixLab",
  webDir: "out",
  plugins: {
    Camera: {
      presentationStyle: "fullscreen",
    },
  },
};

export default config;
