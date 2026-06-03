import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "NailsByGabs logo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = join(process.cwd(), "public", "branding", "Nails by Gabs.png");
  const logoBuffer = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(165deg, #fff8fa 0%, #f1fbf3 45%, #fff5f8 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            borderRadius: 32,
            border: "3px solid #c9a227",
            background: "rgba(255, 255, 255, 0.92)",
            boxShadow: "0 24px 48px rgba(198, 40, 40, 0.08)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="" width={320} height={320} />
          <p
            style={{
              marginTop: 24,
              fontSize: 42,
              color: "#c62828",
              letterSpacing: "0.04em",
            }}
          >
            NailsByGabs
          </p>
          <p style={{ marginTop: 8, fontSize: 28, color: "#8ccf9b" }}>GelX Nails</p>
        </div>
      </div>
    ),
    { ...size }
  );
}
