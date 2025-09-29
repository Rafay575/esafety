import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";

/** Replace with real fetch — using a tiny inline mock for demo */
const mockFetch = (id: number) => ({
  id,
  ptwNo: "PTW-25-0129",
  jobTitle: "Pole-top Insulator Replacement – Feeder 11",
  status: "Submitted" as "Submitted",
  lastUpdate: "2025-09-19 12:34",
  photosCount: 3,
  gps: { lat: 31.5204, lng: 74.3587 },
  checklist: {
    toolsRemoved: true,
    earthingRemoved: true,
    dangerBoardsRemoved: true,
    siteCleared: true,
    controlRoomInformed: true,
  },
  notes: "Final sweep done. Control room notified over phone log #4421.",
});

const CompletionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const data = mockFetch(Number(id));

  const ck = data.checklist;
  const items = [
    { label: "Tools removed", val: ck.toolsRemoved },
    { label: "Earthing removed", val: ck.earthingRemoved },
    { label: "Danger boards removed", val: ck.dangerBoardsRemoved },
    { label: "Site cleared", val: ck.siteCleared },
    { label: "Control room informed", val: ck.controlRoomInformed },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Completion – View</h2>
        <div className="ml-auto">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-6">
              <div className="text-xs text-slate-500">PTW No</div>
              <div className="text-sm font-medium">{data.ptwNo}</div>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="text-xs text-slate-500">Status</div>
              <div className="text-sm font-medium">{data.status}</div>
            </div>
            <div className="col-span-12">
              <div className="text-xs text-slate-500">Job Title</div>
              <div className="text-sm font-medium">{data.jobTitle}</div>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="text-xs text-slate-500">Last Update</div>
              <div className="text-sm">{data.lastUpdate}</div>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="text-xs text-slate-500">Evidence Photos</div>
              <div className="text-sm">{data.photosCount}</div>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="text-xs text-slate-500">GPS</div>
              <div className="text-sm">
                {data.gps ? `${data.gps.lat.toFixed(5)}, ${data.gps.lng.toFixed(5)}` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          <div className="mb-3 font-medium">Final Checklist</div>
          <Table className="table-auto w-full">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="text-left px-4 py-2">Item</Table.Th>
                <Table.Th className="text-left px-4 py-2">Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((it) => (
                <Table.Tr key={it.label}>
                  <Table.Td className="px-4 py-2">{it.label}</Table.Td>
                  <Table.Td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset
                      bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {it.val ? "Completed" : "Pending"}
                    </span>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="col-span-12 intro-y">
          <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
            <div className="mb-2 font-medium">Notes</div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{data.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletionDetailPage;
