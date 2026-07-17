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
          backgroundColor: "#0F172A",
          borderRadius: "20%",
          fontSize: "16px",
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          backgroundImage: "linear-gradient(135deg, #8B5CF6, #3B82F6, #10B981)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
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