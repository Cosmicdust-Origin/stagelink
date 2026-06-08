import { readFile } from "fs/promises";
import { ImageResponse } from "next/og";
import { join } from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontBold = await readFile(
    join(process.cwd(), "public", "fonts", "NanumGothic-Bold.ttf"),
  );
  const fontRegular = await readFile(
    join(process.cwd(), "public", "fonts", "NanumGothic-Regular.ttf"),
  );

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
            "linear-gradient(135deg, #0c1140 0%, #1a1f6e 30%, #3a1a7c 65%, #1a0c3c 100%)",
        }}
      >
        {/* 중앙 글로우 효과 */}
        <div
          style={{
            position: "absolute",
            width: "700px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(80,60,200,0.35) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* STAGELINK 타이틀 */}
        <div
          style={{
            fontSize: 104,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-3px",
            fontFamily: "NanumGothic",
            lineHeight: 1,
            display: "flex",
          }}
        >
          STAGELINK
        </div>

        {/* 서브타이틀 */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.72)",
            marginTop: 20,
            fontFamily: "NanumGothic",
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          지하돌 특전관리 · 통합 정산 시스템
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NanumGothic", data: fontBold, weight: 700, style: "normal" },
        {
          name: "NanumGothic",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
