"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput, FormSelect } from "@/components/Base/Form";
import FormLabel from "@/components/Base/Form/FormLabel";
import Button from "@/components/Base/Button";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import {
  Loader,
  Pencil,
  User,
  Building2,
  History,
  Mail,
  Calendar,
  MapPin,
  Zap,
  Landmark,
  Router,
  ShieldCheck,
  Users,
  ClipboardList,
  ClipboardCheck,
  Hourglass,
  XCircle,
  CreditCard,
  BadgeCheck,
} from "lucide-react";

// ============================================================
// Design tokens
// Base canvas   : slate-50 / white cards
// Ink           : slate-900 / slate-500 (secondary)
// Accent (live) : indigo-500  -> primary accent, active tab, signature dots, badges
// Status good   : emerald-500 -> active / current posting
// Status bad    : rose-500 -> inactive
// Signature     : deep indigo banner with faint diagonal "grid line" texture
//                 behind the avatar, and a vertical transmission-line timeline
//                 on the Posting History tab.
// ============================================================

// ---------- Types ----------
type Region = { id?: number; code?: string; name: string };
type Circle = { id?: number; region_id?: number; code?: string; name: string };
type Division = { id?: number; circle_id?: number; code?: string; name: string };
type SubDivision = {
  id?: number;
  division_id?: number;
  circle_id?: number;
  code?: string;
  name: string;
};
type FeederInfo = {
  id?: number;
  sub_division_id?: number;
  grid_station_id?: string;
  code?: string;
  name: string;
  voltage_level?: string | null;
};

export type Posting = {
  id: number;
  effective_from: string;
  effective_to: string;
  region?: Region | null;
  circle?: Circle | null;
  division?: Division | null;
  sub_division?: SubDivision | null;
  feeder?: FeederInfo | null;
};

// Reporting team member — adapted to the real API shape
type TeamReportee = {
  id: number;
  name: string;
  avatar_url?: string | null;
  designation_name?: string | null; // mapped from 'designation'
  department_name?: string | null; // not provided, can be null
  sub_division_name?: string | null; // mapped from 'sub_division'
  is_active?: number; // not provided, default 1
  ptw_open?: number; // mapped from 'open'
  ptw_closed?: number; // mapped from 'closed'
  ptw_reject?: number; // mapped from 'reject'
  reports_to?: string | null;
  closed_percent?: number;
};

// PTW activity summary for this user
type PtwStats = {
  total_open: number;
  closed: number;
  pending: number;
  reject: number;
  this_month_open?: number;
};

type Profile = {
  id: number;
  name: string;
  gender: string | null;
  cnic: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  email: string;
  sap_code: string;
  department_name: string | null;
  designation_name: string | null;
  is_active: number;
  is_verified?: number;
  date_of_joining: string | null;
  avatar_url: string | null;
  current_posting: Posting | null;
  postings: Posting[];
  roles: { id: number; name: string }[];
};

// ---------- Zod schema (only editable fields) ----------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  cnic: z
    .string()
    .min(1, "CNIC is required")
    .regex(/^\d{5}-\d{7}-\d{1}$/, "Format must be 00000-0000000-0"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // allow empty
        const cleaned = val.replace(/[^0-9+]/g, "");
        return /^\+?\d{10,15}$/.test(cleaned);
      },
      { message: "Enter a valid phone number" }
    ),
  date_of_birth: z.string().optional(),
  address: z.string().min(1, "Address is required"),
});
type FormData = z.infer<typeof formSchema>;

// ---------- Avatar helper ----------
const isDefaultAvatar = (url?: string | null) => {
  if (!url) return true;
  return url.toLowerCase().includes("default");
};

type TabKey = "personal" | "organizational" | "postings" | "team";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "personal", label: "Personal", icon: User },
  { key: "organizational", label: "Organizational", icon: Building2 },
  { key: "postings", label: "Posting History", icon: History },
  { key: "team", label: "Team & Stats", icon: Users },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("personal");

  // Team & Stats states
  const [team, setTeam] = useState<TeamReportee[]>([]);
  const [ptwStats, setPtwStats] = useState<PtwStats | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [tabApplicable, setTabApplicable] = useState<boolean>(true);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: undefined,
      cnic: "",
      phone: "",
      date_of_birth: "",
      address: "",
    },
  });

  // ---------- Load profile ----------
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get(`/api/v1/profile`);
        const p: Profile = data?.data;

        setProfile(p);

        setValue("name", p?.name || "");
        setValue("gender", (p?.gender as any) || undefined);
        setValue("cnic", p?.cnic || "");
        setValue("phone", p?.phone || "");
        setValue(
          "date_of_birth",
          p?.date_of_birth ? p.date_of_birth.split("T")[0] : "",
        );
        setValue("address", p?.address || "");
      } catch (e) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [setValue]);

  // ---------- Load team & stats using profile.id ----------
  useEffect(() => {
    if (!profile?.id) return;

    const loadTeamStats = async () => {
      setTeamLoading(true);
      try {
        const response = await api.get(`/api/v1/meta/users/${profile.id}/team-stats`);
        const apiData = response.data?.data;

        // Map API response to our shapes
        const applicable = apiData?.tab_applicable ?? true;
        setTabApplicable(applicable);

        if (!applicable) {
          setTeam([]);
          setPtwStats(null);
          return;
        }

        // Map ptw_activity
        const activity = apiData?.ptw_activity;
        if (activity) {
          setPtwStats({
            total_open: activity.total_open,
            closed: activity.closed,
            pending: activity.pending,
            reject: activity.reject,
            this_month_open: activity.opened_this_month,
          });
        } else {
          setPtwStats(null);
        }

        // Map reporting_team
        const reportingTeam = apiData?.reporting_team ?? [];
        const mappedTeam: TeamReportee[] = reportingTeam.map((m: any) => ({
          id: m.id,
          name: m.name,
          avatar_url: m.avatar_url,
          designation_name: m.designation,
          sub_division_name: m.sub_division,
          reports_to: m.reports_to,
          is_active: 1, // not provided; assume active
          ptw_open: m.open ?? 0,
          ptw_closed: m.closed ?? 0,
          ptw_reject: m.reject ?? 0,
          closed_percent: m.closed_percent,
        }));
        setTeam(mappedTeam);
      } catch (err) {
        console.error("Failed to load team stats", err);
        setTeam([]);
        setPtwStats(null);
      } finally {
        setTeamLoading(false);
      }
    };

    loadTeamStats();
  }, [profile?.id]);

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar image must be under 2MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ---------- Submit ----------
const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    const fd = new FormData();
    fd.append("name", data.name);
    if (data.gender) fd.append("gender", data.gender);
    fd.append("cnic", data.cnic);
    // Clean phone before sending
    const cleanedPhone = (data.phone ?? "").replace(/[^0-9+]/g, "");
    fd.append("phone", cleanedPhone);
    if (data.date_of_birth) fd.append("date_of_birth", data.date_of_birth);
    fd.append("address", data.address);
    if (avatarFile) fd.append("avatar", avatarFile);

    const res = await api.post("/api/v1/profile-update", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Profile updated successfully");
    const updated: Profile = res?.data?.data;
    if (updated) setProfile(updated);
    setAvatarFile(null);
  } catch (error) {
    console.error("Profile update error:", error);
    toast.error("Failed to update profile");
  } finally {
    setIsSubmitting(false);
  }
};

  const sortedPostings = useMemo(() => {
    if (!profile?.postings) return [];
    return [...profile.postings].sort(
      (a, b) =>
        new Date(b.effective_from).getTime() -
        new Date(a.effective_from).getTime(),
    );
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-indigo-500">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }

  if (!profile) return null;

  const avatarSrc =
    avatarPreview ||
    (!isDefaultAvatar(profile.avatar_url) ? profile.avatar_url! : "/avatar.png");

  const cp = profile.current_posting;

  return (
    <div className="min-h-screen bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto  px-4 md:px-6 pb-24">
        {/* ---------------- Identity card (banner + avatar) ---------------- */}
        <div className="pt-6">
          <div className="rounded-2xl overflow-hidden border border-indigo-100 bg-white shadow-sm">
            {/* Banner — deep indigo with faint circuit-grid texture */}
            <div className="relative h-28 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950">
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 26px)",
                }}
              />
              {/* Soft radial glow in the center for depth */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)]" />
              <div className="absolute top-0 right-0 h-full w-1.5 bg-indigo-500" />
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-12">
                <div className="relative">
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/avatar.png";
                    }}
                  />
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-white ${
                      profile.is_active ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    title={profile.is_active ? "Active" : "Inactive"}
                  />
                  <label
                    htmlFor="avatar-input"
                    className="absolute -top-1 -right-1 bg-indigo-900 text-white rounded-full p-1.5 cursor-pointer hover:bg-indigo-700 shadow"
                    title="Change photo"
                  >
                    <Pencil size={12} />
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleAvatarChange(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {profile.name}
                  </h1>
                  {profile.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck size={11} /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Inactive
                    </span>
                  )}
                  {profile.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <BadgeCheck size={11} /> Verified
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {profile.designation_name || "—"}
                  {profile.department_name ? ` · ${profile.department_name}` : ""}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {profile.roles?.map((r) => (
                    <span
                      key={r.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {r.name}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                    SAP {profile.sap_code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Tab switcher ---------------- */}
        <div className="mt-6 sticky top-4 z-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 border border-slate-200 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              // Optionally hide team tab if not applicable
              if (tab.key === "team" && !tabApplicable) return null;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? "text-indigo-500" : "text-slate-400"}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- Tab content ---------------- */}
        <div className="mt-5">
          {/* ---------- PERSONAL ---------- */}
          {activeTab === "personal" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <SectionHeading
                icon={User}
                title="Personal Information"
                subtitle="These details can be updated at any time."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Full Name</FormLabel>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <FormInput required {...field} />}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <FormLabel>Gender</FormLabel>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <FormSelect value={field.value ?? ""} onChange={field.onChange}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </FormSelect>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>CNIC</FormLabel>
                  <Controller
                    name="cnic"
                    control={control}
                    render={({ field }) => (
                      <FormInput required placeholder="00000-0000000-0" {...field} />
                    )}
                  />
                  {errors.cnic && (
                    <p className="text-xs text-red-500 mt-1">{errors.cnic.message}</p>
                  )}
                </div>

                <div>
                  <FormLabel>Phone</FormLabel>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <FormInput required placeholder="+92300XXXXXXX" {...field} />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <FormLabel>Date of Birth</FormLabel>
                  <Controller
                    name="date_of_birth"
                    control={control}
                    render={({ field }) => <FormInput type="date" {...field} />}
                  />
                </div>

                <div>
                  <FormLabel>Email</FormLabel>
                  <FormInput value={profile.email} readOnly className="bg-gray-100" />
                </div>

                <div className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => <FormInput required {...field} />}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
               <Button type="submit" variant="primary" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader className="animate-spin mr-2" size={16} />
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</Button>
              </div>
            </div>
          )}

          {/* ---------- ORGANIZATIONAL ---------- */}
          {activeTab === "organizational" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <SectionHeading
                icon={Building2}
                title="Organizational Details"
                subtitle="Managed by administration — read only."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoTile icon={Mail} label="Email" value={profile.email} />
                <InfoTile icon={CreditCard} label="SAP Code" value={profile.sap_code} mono />
                <InfoTile icon={Building2} label="Department" value={profile.department_name} />
                <InfoTile icon={User} label="Designation" value={profile.designation_name} />
                <InfoTile
                  icon={Landmark}
                  label="Region"
                  value={cp?.region ? `${cp.region.name} (${cp.region.code})` : undefined}
                />
                <InfoTile
                  icon={Landmark}
                  label="Circle"
                  value={cp?.circle ? `${cp.circle.name} (${cp.circle.code})` : undefined}
                />
                <InfoTile
                  icon={MapPin}
                  label="Division"
                  value={cp?.division ? `${cp.division.name} (${cp.division.code})` : undefined}
                />
                <InfoTile
                  icon={MapPin}
                  label="Sub Division"
                  value={
                    cp?.sub_division
                      ? `${cp.sub_division.name} (${cp.sub_division.code})`
                      : undefined
                  }
                />
                <InfoTile
                  icon={Zap}
                  label="Feeder"
                  value={cp?.feeder ? `${cp.feeder.name} (${cp.feeder.code})` : undefined}
                />
                <InfoTile
                  icon={Router}
                  label="Grid Station"
                  value={cp?.feeder?.grid_station_id}
                />
                <InfoTile
                  icon={Calendar}
                  label="Posting Effective"
                  value={cp ? `${cp.effective_from} → ${cp.effective_to}` : undefined}
                />
                <InfoTile
                  icon={Calendar}
                  label="Date of Joining"
                  value={profile.date_of_joining}
                />
              </div>
            </div>
          )}

          {/* ---------- POSTING HISTORY ---------- */}
          {activeTab === "postings" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                icon={History}
                title="Posting History"
                subtitle={`${sortedPostings.length} posting${
                  sortedPostings.length !== 1 ? "s" : ""
                } on record, most recent first.`}
              />

              {sortedPostings.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-10">
                  No posting history found.
                </div>
              ) : (
                <div className="mt-5 relative">
                  {sortedPostings.map((post, idx) => {
                    const isCurrent = post.id === profile.current_posting?.id;
                    const isLast = idx === sortedPostings.length - 1;
                    return (
                      <div key={post.id} className="relative pl-12 pb-8 last:pb-0">
                        {/* connector line */}
                        {!isLast && (
                          <span className="absolute left-[15px] top-8 bottom-0 w-px bg-indigo-100" />
                        )}
                        {/* node */}
                        <span
                          className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            isCurrent ? "bg-indigo-500" : "bg-slate-300"
                          }`}
                        >
                          <Zap size={14} className="text-white" />
                        </span>

                        <div
                          className={`rounded-xl border p-4 ${
                            isCurrent
                              ? "border-indigo-300 bg-indigo-50/60"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              {post.effective_from} → {post.effective_to}
                            </span>
                            {isCurrent && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                            <Field label="Region" value={post.region?.name} code={post.region?.code} />
                            <Field label="Circle" value={post.circle?.name} code={post.circle?.code} />
                            <Field label="Division" value={post.division?.name} code={post.division?.code} />
                            <Field
                              label="Sub Division"
                              value={post.sub_division?.name}
                              code={post.sub_division?.code}
                            />
                            <Field label="Feeder" value={post.feeder?.name} code={post.feeder?.code} />
                            <Field label="Grid Station" value={post.feeder?.grid_station_id} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------- TEAM & STATS ---------- */}
          {activeTab === "team" && tabApplicable && (
            <div className="space-y-5">
              {/* PTW summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeading
                  icon={ClipboardList}
                  title="PTW Activity"
                  subtitle="Summary of permits you've raised."
                />

                {teamLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="animate-spin text-indigo-400" size={24} />
                  </div>
                ) : !ptwStats ? (
                  <div className="text-sm text-slate-500 text-center py-8">
                    PTW statistics aren't available right now.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <StatCard
                        icon={ClipboardList}
                        label="Total Open"
                        value={ptwStats.total_open}
                        accent="slate"
                      />
                      <StatCard
                        icon={ClipboardCheck}
                        label="Closed"
                        value={ptwStats.closed}
                        accent="emerald"
                      />
                      <StatCard
                        icon={Hourglass}
                        label="Pending"
                        value={ptwStats.pending}
                        accent="amber"
                      />
                      <StatCard
                        icon={XCircle}
                        label="Reject"
                        value={ptwStats.reject}
                        accent="rose"
                      />
                    </div>

                    {/* Open vs Closed progress */}
                    {ptwStats.total_open > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span>Closure progress</span>
                          <span className="font-medium text-slate-700">
                            {Math.round(
                              (ptwStats.closed / ptwStats.total_open) * 100,
                            )}
                            % closed
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${
                                (ptwStats.closed / ptwStats.total_open) * 100
                              }%`,
                            }}
                          />
                          <div
                            className="h-full bg-amber-400"
                            style={{
                              width: `${
                                (ptwStats.pending / ptwStats.total_open) * 100
                              }%`,
                            }}
                          />
                          <div
                            className="h-full bg-rose-400"
                            style={{
                              width: `${
                                (ptwStats.reject / ptwStats.total_open) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex gap-4 mt-2 text-[11px] text-slate-500">
                          <LegendDot color="bg-emerald-500" label="Closed" />
                          <LegendDot color="bg-amber-400" label="Pending" />
                          <LegendDot color="bg-rose-400" label="Reject" />
                        </div>
                      </div>
                    )}

                    {typeof ptwStats.this_month_open === "number" && (
                      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                        <Calendar size={13} />
                        {ptwStats.this_month_open} permit
                        {ptwStats.this_month_open !== 1 ? "s" : ""} opened this
                        month
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Reporting team */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeading
                  icon={Users}
                  title="Reporting Team"
                  subtitle={
                    teamLoading
                      ? undefined
                      : `${team.length} member${team.length !== 1 ? "s" : ""} report to you.`
                  }
                />

                {teamLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="animate-spin text-indigo-400" size={24} />
                  </div>
                ) : team.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-8">
                    No team members currently report to you.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {team.map((member) => {
                      const open = member.ptw_open ?? 0;
                      const closed = member.ptw_closed ?? 0;
                      const reject = member.ptw_reject ?? 0;
                      const pct =
                        open > 0 ? Math.round((closed / open) * 100) : 0;
                      return (
                        <div
                          key={member.id}
                          className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={
                                  !isDefaultAvatar(member.avatar_url)
                                    ? member.avatar_url!
                                    : "/avatar.png"
                                }
                                alt={member.name}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/avatar.png";
                                }}
                              />
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                                  member.is_active === 0
                                    ? "bg-rose-500"
                                    : "bg-emerald-500"
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {member.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {member.designation_name || "—"}
                              </div>
                            </div>
                            {member.sub_division_name && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                {member.sub_division_name}
                              </span>
                            )}
                          </div>

                          {/* Per-member PTW open / closed / reject */}
                          <div className="mt-3.5 grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 flex items-center gap-1.5">
                              <ClipboardList size={13} className="text-slate-500 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-800 leading-none">
                                  {open}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Open
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-2 flex items-center gap-1.5">
                              <ClipboardCheck size={13} className="text-emerald-600 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-800 leading-none">
                                  {closed}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Closed
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-2 flex items-center gap-1.5">
                              <XCircle size={13} className="text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-800 leading-none">
                                  {reject}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Reject
                                </div>
                              </div>
                            </div>
                          </div>

                          {open > 0 && (
                            <div className="mt-2.5">
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {pct}% closed
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback if team tab not applicable */}
          {activeTab === "team" && !tabApplicable && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center text-sm text-slate-500">
              Team information is not applicable for your role.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------- Small presentational helpers ----------
function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-indigo-600" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-3 hover:border-indigo-200 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-indigo-500" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</div>
        <div
          className={`text-sm font-medium text-slate-800 truncate ${mono ? "font-mono" : ""}`}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

const STAT_ACCENTS: Record<
  "slate" | "emerald" | "amber" | "rose",
  { bg: string; text: string; border: string }
> = {
  slate: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: "slate" | "emerald" | "amber" | "rose";
}) {
  const tone = STAT_ACCENTS[accent];
  return (
    <div className={`rounded-xl border p-4 ${tone.border} ${tone.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        <Icon size={16} className={tone.text} />
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Field({ label, value, code }: { label: string; value?: string; code?: string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-slate-800 font-medium">
        {value || "—"}
        {code ? <span className="text-slate-400 font-normal"> ({code})</span> : null}
      </div>
    </div>
  );
}