import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://spiritlhr.github.io",
  base: "/knowledge-base",
});
