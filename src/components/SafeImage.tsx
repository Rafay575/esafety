import React, { useEffect, useState } from "react";
import { api } from "@/lib/axios";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  style?: React.CSSProperties;
};

export function SafeImage({ src, alt, className, onClick, style }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;

    async function load() {
      try {
        if (!src) {
          setErrored(true);
          return;
        }

        // Already a data/blob URL — use as-is
        if (src.startsWith("data:") || src.startsWith("blob:")) {
          setObjectUrl(src);
          return;
        }

        // Fetch through axios so auth headers (Bearer token, X-Company-ID)
        // are automatically attached by the interceptor
        const res = await api.get(src, {
          responseType: "blob",
          headers: { Accept: "image/*" },
        });

        const blobUrl = URL.createObjectURL(res.data as Blob);
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        revoke = blobUrl;
        setObjectUrl(blobUrl);
      } catch (err) {
        console.error("[SafeImage] failed:", src, err);
        setErrored(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src]);

  if (errored) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#94a3b8",
          fontSize: 10,
          textAlign: "center",
          padding: 4,
          ...style,
        }}
      >
        Image unavailable
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div
        className={className}
        style={{
          background:
            "linear-gradient(90deg,#eef2f7,#e2e8f0,#eef2f7)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      style={style}
      draggable={false}
    />
  );
}