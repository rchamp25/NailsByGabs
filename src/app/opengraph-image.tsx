import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Nails By Gabs pink wordmark logo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = join(process.cwd(), "public", "branding", "NailsByGabsLogo.png");
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
          background: "linear-gradient(145deg, #fff 0%, #fff3f8 50%, #ffe7f1 100%)",
          fontFamily: "Arial, sans-serif",
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            borderRadius: 40,
            background: "#fff",
            boxShadow: "0 24px 70px rgba(255, 0, 116, 0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="" width={720} height={476} />
          <p style={{ marginTop: 2, fontSize: 30, color: "#ff0074", letterSpacing: "0.16em" }}>
            GELX NAILS
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
