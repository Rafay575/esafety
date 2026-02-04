import React, { useState } from "react";
import { useESafetyReportCount } from "./hooks";

export default function Main() {
  const [filters, setFilters] = useState({
    circle_id: 1,
    division_id: 5,
    sub_division_id: 17,
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  const reportCount = useESafetyReportCount();

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={() => reportCount.mutate(filters)}
        disabled={reportCount.isPending}
      >
        {reportCount.isPending ? "Loading..." : "Generate Report"}
      </button>

      {reportCount.isSuccess && (
        <h2>Total Count: {reportCount.data}</h2>
      )}
    </div>
  );
}
