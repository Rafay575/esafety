import { useState, useEffect } from "react";
import { api } from "@/lib/axios";

/* ------------- Types ------------- */
export interface Region { id: number; name: string; }
export interface Circle { id: number; name: string; }
export interface Division { id: number; name: string; }
export interface SubDivision { id: number; name: string; }
export interface Feeder { id: number; name: string; }

/* ------------- Main Hook ------------- */
export function usePostingHierarchy() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [subDivisions, setSubDivisions] = useState<SubDivision[]>([]);
  const [feeders, setFeeders] = useState<Feeder[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [selectedSubDivision, setSelectedSubDivision] = useState<number | null>(null);

  const normalize = (data: any) =>
    data?.rows ?? data?.data ?? data?.lists ?? [];

  /* Load Regions */
  useEffect(() => {
    api
      .get("/api/v1/meta/regions", { params: { per_page: "all" } })
      .then((res) => setRegions(normalize(res.data)));
  }, []);

  /* Region → Circles */
  useEffect(() => {
    if (!selectedRegion) {
      setCircles([]);
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { region_id: selectedRegion } })
      .then((res) => {
        setCircles(res.data?.lists?.circles ?? []);
        setDivisions([]);
        setSubDivisions([]);
        setFeeders([]);
      });
  }, [selectedRegion]);

  /* Circle → Divisions */
  useEffect(() => {
    if (!selectedCircle) {
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { circle_id: selectedCircle } })
      .then((res) => {
        setDivisions(res.data?.lists?.divisions ?? []);
        setSubDivisions([]);
        setFeeders([]);
      });
  }, [selectedCircle]);

  /* Division → SubDivisions */
  useEffect(() => {
    if (!selectedDivision) {
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { division_id: selectedDivision } })
      .then((res) => {
        setSubDivisions(res.data?.lists?.sub_divisions ?? []);
        setFeeders([]);
      });
  }, [selectedDivision]);

  /* SubDivision → Feeders */
  useEffect(() => {
    if (!selectedSubDivision) {
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { sub_division_id: selectedSubDivision } })
      .then((res) => {
        setFeeders(res.data?.lists?.feeders ?? []);
      });
  }, [selectedSubDivision]);

  return {
    regions,
    circles,
    divisions,
    subDivisions,
    feeders,

    selectedRegion,
    selectedCircle,
    selectedDivision,
    selectedSubDivision,

    setSelectedRegion,
    setSelectedCircle,
    setSelectedDivision,
    setSelectedSubDivision,
  };
}
