// src/components/ActivityTokenButton.tsx
import React, { useState } from "react";
import axios from "axios";
import { api } from "@/lib/axios";
import Button from "../Base/Button";

type ActivityTokenResponse = {
  success: boolean;
  token: string;
  expires_at: string;
};

type Props = {
  openUrlAfter?: boolean;
  activityLogBaseUrl?: string;
  buttonText?: string;
};

export default function ActivityTokenButton({
  openUrlAfter = true,
  activityLogBaseUrl = "https://mepco.myflexihr.com/activitylog-ui",
  buttonText = "Open Activity Log",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ActivityTokenResponse | null>(null);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setError("");
    setData(null);

    // ✅ same key your interceptor uses
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("auth_token not found in localStorage.");
      return;
    }

    setLoading(true);
   try {
        // Get signed URL from backend
        const response = await api.get('https://mepco.myflexihr.com/api/generate-activitylog-url');
        const data = await response.data ;
        
        // Open in new tab
        window.open(data.url, '_blank');
    } catch (error) {
        console.error('Error opening activity log:', error);
    
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 mt-5">
      <Button
        as="button"
        variant="primary"
        onClick={handleClick}
        disabled={loading}
        className={[
          "btn btn-primary",
          loading ? "opacity-70 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {loading ? "Generating token..." : buttonText}
      </Button>

      {error ? <div className="text-danger text-sm">{error}</div> : null}

      {data ? (
        <div className="p-3 rounded-md border border-slate-200 text-sm">
          <div className="font-medium mb-2">Activity Token Generated</div>

          <div className="grid gap-1">
            <div>
              <span className="font-medium">Token:</span>{" "}
              <span className="break-all">{data.token}</span>
            </div>
            <div>
              <span className="font-medium">Expires:</span>{" "}
              {new Date(data.expires_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigator.clipboard.writeText(data.token)}
            >
              Copy Token
            </button>

            <a
              className="btn btn-primary"
              href={`${activityLogBaseUrl}?token=${encodeURIComponent(
                data.token
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Activity Log
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
