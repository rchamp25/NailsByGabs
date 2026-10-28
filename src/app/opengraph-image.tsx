import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Nails By Gabs pink wordmark logo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** White card inset inside the 1200x630 image. */
const CARD_INSET = 32;
const CARD = { width: size.width - CARD_INSET * 2, height: size.height - CARD_INSET * 2 };

/**
 * NailsByGabsLogo.png is 1513x1001, but the "Nails By Gabs" lettering only
 * fills rows 53-555; the bow hangs below it to row 952. Centering the whole
 * image left the lettering high on the card, so the layout centers the
 * lettering + tagline as a group and lets the bow hang beside the tagline.
 */
const LOGO_SOURCE = { width: 1513, height: 1001, letteringTop: 53, letteringBottom: 555 };
const LOGO_WIDTH = 660;
const LOGO_SCALE = LOGO_WIDTH / LOGO_SOURCE.width;
const LOGO_HEIGHT = Math.round(LOGO_SOURCE.height * LOGO_SCALE);
const LETTERING_TOP = LOGO_SOURCE.letteringTop * LOGO_SCALE;
const LETTERING_HEIGHT = (LOGO_SOURCE.letteringBottom - LOGO_SOURCE.letteringTop) * LOGO_SCALE;

const TAGLINE_GAP = 24;
const TAGLINE_HEIGHT = 36;
const GROUP_HEIGHT = LETTERING_HEIGHT + TAGLINE_GAP + TAGLINE_HEIGHT;
const GROUP_TOP = (CARD.height - GROUP_HEIGHT) / 2;
const LOGO_TOP = Math.round(GROUP_TOP - LETTERING_TOP);
const TAGLINE_TOP = Math.round(GROUP_TOP + LETTERING_HEIGHT + TAGLINE_GAP);

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
          background: "linear-gradient(145deg, #fff 0%, #fff3f8 50%, #ffe7f1 100%)",
          fontFamily: "Arial, sans-serif",
          padding: CARD_INSET,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: CARD.width,
            height: CARD.height,
            borderRadius: 40,
            background: "#fff",
            boxShadow: "0 24px 70px rgba(255, 0, 116, 0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt=""
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            style={{
              position: "absolute",
              left: Math.round((CARD.width - LOGO_WIDTH) / 2),
              top: LOGO_TOP,
            }}
          />
          <p
            style={{
              position: "absolute",
              top: TAGLINE_TOP,
              left: 0,
              width: CARD.width,
              margin: 0,
              display: "flex",
              justifyContent: "center",
              fontSize: 30,
              lineHeight: `${TAGLINE_HEIGHT}px`,
              color: "#ff0074",
              letterSpacing: "0.16em",
            }}
          >
            GELX NAILS
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
