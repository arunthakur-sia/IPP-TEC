import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas (a pdf-parse dependency, used for PDF deck parsing) is a
  // native-binary package — it must be excluded from the server bundle
  // (loaded via plain `require` instead) or its .node binary fails to resolve.
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse"],
};

export default nextConfig;
