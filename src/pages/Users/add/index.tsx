import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";

// --- Helpers ---
const genUserId = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000; // 4-digit
  return `USR-${yyyy}${mm}${dd}-${rand}`;
};

// --- Mock Cascading Options (replace with API data) ---
const REGION_OPTIONS = ["Punjab", "Sindh", "KPK"]; 
const CIRCLE_MAP: Record<string, string[]> = {
  Punjab: ["Lahore Circle", "Rawalpindi Circle"],
  Sindh: ["Karachi Circle", "Hyderabad Circle"],
  KPK: ["Peshawar Circle", "Abbottabad Circle"],
};
const DIVISION_MAP: Record<string, string[]> = {
  "Lahore Circle": ["Gulberg Division", "Shalimar Division"],
  "Rawalpindi Circle": ["Satellite Town", "Chaklala"],
  "Karachi Circle": ["DHA Division", "Gulshan"],
  "Hyderabad Circle": ["Qasimabad", "Latifabad"],
  "Peshawar Circle": ["Hayatabad Division", "University Town"],
  "Abbottabad Circle": ["Jinnah Road", "Supply Bazar"],
};
const SUBDIVISION_MAP: Record<string, string[]> = {
  "Gulberg Division": ["Block A", "Block B"],
  "Shalimar Division": ["Union 12", "Union 13"],
  "Satellite Town": ["Block A", "Block B"],
  "Chaklala": ["Sec 1", "Sec 2"],
  "DHA Division": ["Phase 4", "Phase 6"],
  "Gulshan": ["Block 5", "Block 7"],
  "Qasimabad": ["Unit 1", "Unit 2"],
  "Latifabad": ["Unit 7", "Unit 11"],
  "Hayatabad Division": ["Sector F-8", "Sector F-10"],
  "University Town": ["Street 1", "Street 9"],
  "Jinnah Road": ["Lane 2", "Lane 7"],
  "Supply Bazar": ["Area 3", "Area 5"],
};

// New domain options
const DESIGNATIONS = [
  "Assistant Manager",
  "Assistant Engineer",
  "Line Superintendent",
  "SSE",
];
const DEPARTMENTS = ["HR", "Operations", "IT", "Finance", "Customer Service"];
const GENDERS = ["Male", "Female", "Other"] as const;

const AddUserPage: React.FC = () => {
  const navigate = useNavigate();

  // Auto IDs
  const [userId, setUserId] = useState("");

  // Org unit
  const [region, setRegion] = useState("");
  const [circle, setCircle] = useState("");
  const [division, setDivision] = useState("");
  const [subdivision, setSubdivision] = useState("");

  // Employment / personal fields (updated as per request)
  const [sapCode, setSapCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [address, setAddress] = useState("");
  const [cnic, setCnic] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [doj, setDoj] = useState(""); // Date of Joining
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setUserId(genUserId());
  }, []);

  // Cascading dependent options
  const circles = useMemo(() => (region ? CIRCLE_MAP[region] || [] : []), [region]);
  const divisions = useMemo(() => (circle ? DIVISION_MAP[circle] || [] : []), [circle]);
  const subdivisions = useMemo(() => (division ? SUBDIVISION_MAP[division] || [] : []), [division]);

  // Reset deeper levels when upper changes
  useEffect(() => { setCircle(""); setDivision(""); setSubdivision(""); }, [region]);
  useEffect(() => { setDivision(""); setSubdivision(""); }, [circle]);
  useEffect(() => { setSubdivision(""); }, [division]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!sapCode.trim()) e.sapCode = "SAP Code is required";
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!gender) e.gender = "Gender is required";
    if (!cnic.match(/^\d{5}-\d{7}-\d{1}$/)) e.cnic = "CNIC must be xxxxx-xxxxxxx-x";
    if (!address.trim()) e.address = "Address is required";
    if (!designation) e.designation = "Designation is required";
    if (!department) e.department = "Department is required";
    if (!doj) e.doj = "Date of Joining is required";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!phone.match(/^\+?\d[\d\s-]{6,}$/)) e.phone = "Valid phone required";

    if (!region) e.region = "Region is required";
    if (!circle) e.circle = "Circle is required";
    if (!division) e.division = "Division is required";
    if (!subdivision) e.subdivision = "Sub-Division is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      user_id: userId, // internal auto id
      sap_code: sapCode,
      personal: {
        name: fullName,
        gender,
        cnic,
        address,
        phone,
        email,
        designation,
        department,
        date_of_joining: doj,
      },
      org_unit: { region, circle, division, sub_division: subdivision },
    };
    console.log("SUBMIT", payload);
    // TODO: call API
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">Add New User</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>Reset Form</Button>
          <Button variant="primary" onClick={onSubmit}>
            <Lucide icon="Save" className="w-4 h-4 mr-2" /> Save User
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <form className="col-span-12 box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600" onSubmit={onSubmit}>
        <div className="grid grid-cols-12 gap-6">
          {/* Employment / IDs */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Employment</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">User ID (auto)</span>
                <FormInput value={userId} disabled readOnly />
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">SAP Code *</span>
                <FormInput value={sapCode} onChange={(e) => setSapCode(e.target.value)} placeholder="e.g., 10023456" />
                {errors.sapCode && <p className="text-rose-500 text-xs mt-1">{errors.sapCode}</p>}
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Date of Joining *</span>
                <FormInput type="date" value={doj} onChange={(e) => setDoj(e.target.value)} />
                {errors.doj && <p className="text-rose-500 text-xs mt-1">{errors.doj}</p>}
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Designation *</span>
                <FormSelect value={designation} onChange={(e) => setDesignation(e.target.value)}>
                  <option value="">Select</option>
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </FormSelect>
                {errors.designation && <p className="text-rose-500 text-xs mt-1">{errors.designation}</p>}
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Department *</span>
                <FormSelect value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </FormSelect>
                {errors.department && <p className="text-rose-500 text-xs mt-1">{errors.department}</p>}
              </label>
            </div>
          </div>

          {/* Org Unit */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Organization Unit</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 sm:col-span-6 lg:col-span-3">
                <span className="text-xs text-slate-500">Region *</span>
                <FormSelect value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Select</option>
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </FormSelect>
                {errors.region && <p className="text-rose-500 text-xs mt-1">{errors.region}</p>}
              </label>

              <label className="col-span-12 sm:col-span-6 lg:col-span-3">
                <span className="text-xs text-slate-500">Circle *</span>
                <FormSelect value={circle} onChange={(e) => setCircle(e.target.value)} disabled={!region}>
                  <option value="">Select</option>
                  {circles.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </FormSelect>
                {errors.circle && <p className="text-rose-500 text-xs mt-1">{errors.circle}</p>}
              </label>

              <label className="col-span-12 sm:col-span-6 lg:col-span-3">
                <span className="text-xs text-slate-500">Division *</span>
                <FormSelect value={division} onChange={(e) => setDivision(e.target.value)} disabled={!circle}>
                  <option value="">Select</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </FormSelect>
                {errors.division && <p className="text-rose-500 text-xs mt-1">{errors.division}</p>}
              </label>

              <label className="col-span-12 sm:col-span-6 lg:col-span-3">
                <span className="text-xs text-slate-500">Sub-Division *</span>
                <FormSelect value={subdivision} onChange={(e) => setSubdivision(e.target.value)} disabled={!division}>
                  <option value="">Select</option>
                  {subdivisions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </FormSelect>
                {errors.subdivision && <p className="text-rose-500 text-xs mt-1">{errors.subdivision}</p>}
              </label>
            </div>
          </div>

          {/* Personal */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Personal</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Name *</span>
                <FormInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Ayesha Khan" />
                {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName}</p>}
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Gender *</span>
                <FormSelect value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </FormSelect>
                {errors.gender && <p className="text-rose-500 text-xs mt-1">{errors.gender}</p>}
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">CNIC *</span>
                <FormInput value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="12345-1234567-1" maxLength={15} />
                {errors.cnic && <p className="text-rose-500 text-xs mt-1">{errors.cnic}</p>}
              </label>

              <label className="col-span-12">
                <span className="text-xs text-slate-500">Address *</span>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, Area, City" className="w-full !box rounded-md p-3 min-h-[96px] text-sm" />
                {errors.address && <p className="text-rose-500 text-xs mt-1">{errors.address}</p>}
              </label>

              <label className="col-span-12 md:col-span-6">
                <span className="text-xs text-slate-500">Phone *</span>
                <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3xx xxxxxxx" />
                {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
              </label>

              <label className="col-span-12 md:col-span-6">
                <span className="text-xs text-slate-500">Email *</span>
                <FormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="col-span-12 flex items-center justify-end gap-2 pt-2">
            <Button variant="outline-secondary" type="button" onClick={() => navigate(-1)}>
              <Lucide icon="X" className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Create User
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddUserPage;
