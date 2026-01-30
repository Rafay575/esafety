"use client";

import { useParams, useNavigate } from "react-router-dom";
import { usePostingHistory, useUser } from "../hooks";
import { Loader } from "lucide-react";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { useState } from "react";
import { CreatePostingModal } from "./dailog";

export default function ViewUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = Number(id);

  // If ID is missing or NaN
  if (!userId || isNaN(userId)) {
    return (
      <div className="p-10 text-center text-red-500">
        ❌ Invalid User ID in URL
      </div>
    );
  }

  const { data, isLoading, isError } = useUser(userId);

  // Loading screen
  if (isLoading) {
    return (
      <div className="p-10 text-center text-slate-500">
        <Loader className="mx-auto animate-spin" />
        <p className="mt-2 text-xs">Loading user...</p>
      </div>
    );
  }
  console.log(data);
  // Error handling
  if (isError || !data) {
    return (
      <div className="p-10 text-center text-red-500">
        ❌ Failed to load user.
      </div>
    );
  }

  const user = data;

  return (
    <div className="my-8">
      {/* ---------------- Header ---------------- */}
      <div className="flex intro-y justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <Lucide icon="User" className="w-7 h-7 text-primary" />
          User Profile
        </h1>
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="primary"
            onClick={() => navigate(`/users/${userId}/edit`)}
          >
            <Lucide icon="PencilLine" className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        </div>
      </div>

      {/* ---------------- Card ---------------- */}
      <div className="bg-white/80 intro-y backdrop-blur-xl border rounded-2xl shadow-lg p-8 space-y-10">
        {/* ---------------- Avatar Section ---------------- */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={user.avatar_url || "/default-avatar.png"}
              alt="User Avatar"
              className="w-32 h-32 rounded-full object-cover shadow-md border bg-slate-50"
            />

            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-slate-800">
                {user.name}
              </h2>

              <p className="inline-flex items-center gap-2 font-medium text-primary">
                <Lucide icon="Shield" className="w-4 h-4" />
                {user.roles?.[0]?.name || "N/A"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs rounded-full ${
              user.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* ---------------- Info Grid ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Personal Section */}
          <Section title="Personal Information" icon="UserCircle">
            <Info label="Gender" value={user.gender} />
            <Info label="CNIC" value={user.cnic} />
            <Info label="Phone" value={user.phone} />
            <Info label="Email" value={user.email} />
            <Info
              label="Date of Birth"
              value={formatDate(user.date_of_birth)}
            />
          </Section>

          {/* Employment Section */}
          <Section title="Employment Information" icon="Briefcase">
            <Info label="SAP Code" value={user.sap_code} />
            <Info label="Department" value={user.department_name} />
            <Info label="Designation" value={user.designation_name} />
            <Info
              label="Date of Joining"
              value={formatDate(user.date_of_joining)}
            />
          </Section>
        </div>

        {/* ---------------- Account Meta ---------------- */}
        <Section title="Account Details" icon="Clock">
          <Info label="Created At" value={formatDT(user.created_at)} />
          <Info label="Updated At" value={formatDT(user.updated_at)} />
          <Info label="Last Login" value={formatDT(user.last_login_at)} />
        </Section>
        {/* ---------------- Posting History ---------------- */}
        <PostingHistory userId={userId} />
      </div>
    </div>
  );
}

/* ---------- Child Components ---------- */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
        {/* <Lucide icon={icon} className="w-5 h-5 text-primary" /> */}
        {title}
      </h3>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

/* ---------- Helper Functions ---------- */
function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB");
}

function formatDT(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


function PostingHistory({ userId }: { userId: number }) {
  const { data: history, isLoading, isError, refetch } = usePostingHistory(userId);
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading)
    return (
      <div className="bg-white mt-10 p-6 rounded-2xl border shadow animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="h-20 bg-slate-100 rounded"></div>
      </div>
    );

  if (isError)
    return (
      <div className="bg-white mt-10 p-6 rounded-2xl border shadow">
        <p className="text-red-500">Failed to load posting history.</p>
      </div>
    );

  return (
    <div className="bg-white mt-10 p-8 rounded-2xl border shadow space-y-6">

      {/* ------------ HEADER ------------ */}
      <h2 className="text-xl font-bold text-slate-800 flex justify-between items-center gap-2">
        <div className="flex gap-3 items-center">
          <Lucide icon="History" className="w-5 h-5 text-primary" />
          Posting History
        </div>

        <Button
          variant="primary"
          className="text-xs"
          onClick={() => setCreateOpen(true)}
        >
          Add New
        </Button>
      </h2>

      {/* ---------- CREATE MODAL ---------- */}
      <CreatePostingModal
        open={createOpen}
        userId={userId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          refetch();
        }}
      />

      {/* ---------- EMPTY STATE ---------- */}
      {(!history || history.length === 0) && (
        <div className="p-6 rounded-xl border bg-slate-50 text-center text-slate-500">
          No posting history found.
        </div>
      )}

      {/* ---------- TIMELINE LIST ---------- */}
      <div className="relative border-l border-slate-300 pl-6 space-y-8">
        {history?.map((h: any) => (
          <div key={h.id} className="relative">
            {/* timeline dot */}
            <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-4 border-white bg-primary shadow" />

            <div className="rounded-xl border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50 p-5">

              {/* DATE */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  <Lucide icon="Calendar" className="inline w-4 h-4 mr-1 text-primary" />
                  {formatDT(h.changed_on)}
                </p>
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  Posting Updated
                </span>
              </div>

              {/* EFFECTIVE DATES */}
              <div className="mt-2 text-xs text-slate-500">
                Effective: <b>{h.effective_from}</b> → <b>{h.effective_to}</b>
              </div>

              {/* POSTING BLOCK */}
              <div className="p-4 mt-4 border rounded-xl bg-white shadow-inner">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Lucide icon="MapPin" className="w-4 h-4 text-primary" />
                  Posting Details
                </h3>

                <PostingBlock data={h} />
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostingBlock({ data }: { data: any }) {
  return (
    <div className="text-sm space-y-1">
      <PostingRow label="Region" value={data.region?.name} />
      <PostingRow label="Circle" value={data.circle?.name} />
      <PostingRow label="Division" value={data.division?.name} />
      <PostingRow label="Sub Division" value={data.sub_division?.name} />
      <PostingRow label="Feeder" value={data.feeder?.name} />
    </div>
  );
}

function PostingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}
