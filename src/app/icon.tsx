import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "طيف";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d0d",
          borderRadius: "20%",
          fontSize: "16px",
          fontWeight: 800,
          color: "#d4a853",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        طيف
      </div>
    ),
    {
      ...size,
    },
  );
}