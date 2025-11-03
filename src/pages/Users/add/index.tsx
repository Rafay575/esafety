"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreateUserForm from "./CreateUserForm"; // your component
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";

export default function UsersUpsertPage() {
  const { id } = useParams();          // /users/add  -> id undefined
  const navigate = useNavigate();       // /users/:id/edit -> id = "28"
  const userId = id ? Number(id) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lucide icon={userId ? "UserCheck" : "UserPlus"} className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">
            {userId ? "Edit User" : "Create New User"}
          </h1>
        </div>

        <Button variant="outline-secondary" onClick={() => navigate("/users")}>
          <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" /> Back to Users
        </Button>
      </div>

      {/* Pass userId down — if present, form is in EDIT mode */}
      <CreateUserForm userId={userId} />
    </div>
  );
}
