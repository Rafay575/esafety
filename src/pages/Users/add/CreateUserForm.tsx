import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { FormInput, FormLabel } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { useDepartments, useDesignations, useRoles, useUser } from "../hooks";
import { FormValues, schema } from "../schemas";
import SearchSelect from "@/components/Base/SearchSelect";
import PasswordInput from "@/components/Base/Form/PasswordInput";
import { Loader } from "lucide-react";
import DateSelector from "@/components/Base/Form/DateSelector";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";

interface Props {
  userId?: number;
}

export default function CreateUserForm({ userId }: Props) {
  const isEdit = !!userId;
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);

  const { data: userData, isLoading: userLoading } = useUser(userId);
  const { data: departments = [], isLoading: deptLoading } = useDepartments();
  const { data: designations = [], isLoading: desigLoading } =
    useDesignations(selectedDept);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  // 🧠 Helper to format date to yyyy-mm-dd
  function formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  }

  const GENDERS = useMemo(
    () => [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
    []
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  // 🔄 Prefill user data
  useEffect(() => {
    if (!userData) return;

    const deptId =
      userData?.designation?.department_id ?? userData?.department_id ?? null;
    setSelectedDept(deptId);

    reset(
      {
        name: userData.name ?? "",
        gender: (userData.gender as any) ?? "",
        cnic: userData.cnic ?? "",
        email: userData.email ?? "",
        phone: userData.phone ?? "",
        sap_code: userData.sap_code ?? "",
        department_id: (deptId ?? "") as any,
        designation_id: (userData.designation_id ?? "") as any,
        role: userData.roles?.[0]?.name || "",
        date_of_birth: userData.date_of_birth ?? "",
        date_of_joining: userData.date_of_joining ?? "",
      },
      { keepDirty: false }
    );

    setAvatarPreview(userData.avatar_url || null);
  }, [userData, reset]);

  // --- Avatar handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  // --- Build changed-only payload
  function buildChangedOnly(): Partial<FormValues> {
    const vals = getValues();
    const changed: Partial<FormValues> = {};

    (Object.keys(dirtyFields) as (keyof FormValues)[]).forEach((key) => {
      if (dirtyFields[key]) (changed as any)[key] = vals[key] as any;
    });

    // ✅ Always format dates properly if they exist
    if (changed.date_of_birth)
      changed.date_of_birth = formatDate(changed.date_of_birth as any) as any;
    if (changed.date_of_joining)
      changed.date_of_joining = formatDate(
        changed.date_of_joining as any
      ) as any;

    return changed;
  }

  // --- API Mutation (create/update)
  const mutation = useMutation({
    mutationFn: async (payload: {
      mode: "create" | "edit";
      body: Partial<FormValues>;
    }) => {
      const fd = new FormData();
      Object.entries(payload.body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (avatar) fd.append("avatar", avatar);

      if (payload.mode === "edit") {
        fd.append("_method", "PATCH");
        return api.post(`/api/v1/users/${userId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return api.post("/api/v1/users", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "User updated successfully!" : "User created successfully!"
      );
      if (!isEdit) {
        reset();
        removeAvatar();
      }
      navigate("/users");
    },
    onError: (err: any) => {
      console.error("❌ mutation error", err);
      toast.error(err?.response?.data?.message || "Something went wrong.");
    },
  });

  // --- Form submit
  const onSubmit = (data: FormValues) => {
    console.log("hello");
    const formatted: any = {
      ...data,
      date_of_birth: formatDate(data.date_of_birth),
      date_of_joining: formatDate(data.date_of_joining),
    };

    console.log("hello");
    if (isEdit) {
      const changed = buildChangedOnly();
      console.log("🚀 changed", changed);
      const hasAnyChange = Object.keys(changed).length > 0 || !!avatar;
      if (!hasAnyChange) {
        toast.info("No changes to update.");
        return;
      }
      mutation.mutate({ mode: "edit", body: changed });
    } else {
      mutation.mutate({ mode: "create", body: formatted });
    }
  };

  if (userLoading && isEdit) {
    return (
      <div className="p-10 text-center text-slate-500">
        <Loader className="mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <div className="my-5">
      <div className="rounded-2xl border bg-white intro-y shadow-lg p-8 space-y-8 relative">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Lucide
              icon={isEdit ? "UserCheck" : "UserPlus"}
              className="w-6 h-6 text-primary"
            />
            {isEdit ? "Edit User" : "Create New User"}
          </h1>
        </div>

        {/* 🚨 Make sure Button type="submit" actually passes through in your Button component */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-12 gap-6"
        >
          {/* Avatar Upload */}
          <div className="col-span-12 flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-32 h-32 object-cover rounded-full border shadow-inner"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-primary/60 hover:text-primary transition cursor-pointer">
                  <Lucide icon="ImagePlus" className="w-8 h-8" />
                </div>
              )}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-rose-50 p-1 transition"
                >
                  <Lucide icon="X" className="w-4 h-4 text-rose-600" />
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-500">
              Click to {avatarPreview ? "change" : "upload"} profile picture
            </p>
          </div>

          {/* Basic Info */}
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Name *</FormLabel>
            <FormInput {...register("name")} placeholder="Full Name" />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="col-span-12 md:col-span-3">
            <FormLabel>Gender *</FormLabel>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  options={GENDERS}
                  placeholder="Select Gender"
                />
              )}
            />
            {errors.gender && (
              <p className="text-xs text-red-500 mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>
          {/* Date of Birth */}
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Date of Birth *</FormLabel>
            <Controller
              name="date_of_birth"
              control={control}
              render={({ field }) => (
                <DateSelector
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
        if (!date) return field.onChange("");
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        field.onChange(`${yyyy}-${mm}-${dd}`);
      }}
                  placeholder="Select Date of Birth"
                  dateFormat="yyyy/MM/dd"
                />
              )}
            />

            {errors.date_of_birth && (
              <p className="text-xs text-red-500 mt-1">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>

          {/* Date of Joining */}
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Date of Joining *</FormLabel>
            <Controller
              name="date_of_joining"
              control={control}
              render={({ field }) => (
                <DateSelector
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
        if (!date) return field.onChange("");
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        field.onChange(`${yyyy}-${mm}-${dd}`);
      }}
                  placeholder="Select Date of Joining"
                  dateFormat="yyyy/mm/dd"
                />
              )}
            />
            {errors.date_of_joining && (
              <p className="text-xs text-red-500 mt-1">
                {errors.date_of_joining.message}
              </p>
            )}
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>CNIC *</FormLabel>
            <FormInput {...register("cnic")} placeholder="35202-1234567-1" />
            {errors.cnic && (
              <p className="text-xs text-red-500 mt-1">{errors.cnic.message}</p>
            )}
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>Phone *</FormLabel>
            <FormInput {...register("phone")} placeholder="+923001112256" />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>Email *</FormLabel>
            <FormInput {...register("email")} placeholder="user@hrpsp.net" />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>SAP Code *</FormLabel>
            <FormInput {...register("sap_code")} placeholder="1000" />
            {errors.sap_code && (
              <p className="text-xs text-red-500 mt-1">
                {errors.sap_code.message}
              </p>
            )}
          </div>

          {/* Department & Designation */}
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Department *</FormLabel>
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  onChange={(val) => {
                    const id = Number(val);
                    field.onChange(id);
                    setSelectedDept(id);
                  }}
                  value={field.value ?? ""}
                  options={departments.map((d: any) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  placeholder="Select Department"
                  loading={deptLoading}
                />
              )}
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>Designation *</FormLabel>
            <Controller
              name="designation_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  onChange={(val) => field.onChange(Number(val))}
                  value={field.value ?? ""}
                  options={designations.map((d: any) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  placeholder="Select Designation"
                  disabled={!selectedDept}
                  loading={desigLoading}
                />
              )}
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <FormLabel>Role *</FormLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  value={field.value}
                  options={roles.map((r: any) => ({
                    value: r.name,
                    label: r.name,
                  }))}
                  placeholder="Select Role"
                  loading={rolesLoading}
                />
              )}
            />
          </div>

          {/* Password Section (Create only) */}
          {!isEdit && (
            <>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Password *</FormLabel>
                <PasswordInput
                  {...register("password")}
                  placeholder="Enter password"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Confirm Password *</FormLabel>
                <PasswordInput
                  {...register("password_confirmation")}
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="col-span-12 flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => {
                reset();
                removeAvatar();
              }}
            >
              {isEdit ? "Reset Changes" : "Reset"}
            </Button>

            {/* 👇 IMPORTANT: ensure your Button component passes `type` down */}
            <Button
              type="submit" // ✅ now this will actually submit the form
              variant="primary"
              disabled={isSubmitting || mutation.isPending}
            >
              <Lucide icon="Save" className="w-4 h-4 mr-2" />
              {isEdit ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

