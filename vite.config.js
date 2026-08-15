import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` makes the build use relative asset paths, so it works
// whether you deploy it at the root of a domain or under a GitHub Pages
// project path like https://username.github.io/games-for-sale/ — no need
// to hardcode the repo name here. If you deploy with a custom setup that
// needs an absolute base path instead, change this to "/your-repo-name/".
export default defineConfig({
  plugins: [react()],
  base: './'
});
