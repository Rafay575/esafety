import { useRoutes } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/Register";
import ErrorPage from "../pages/ErrorPage";
import Page from "../pages/DashboardOverview1";
import UsersListPage from "../pages/Users";
import UsersUpsertPage from "../pages/Users/add";
import RolesListPage from "../pages/Roles";
import RoleFormPage from "../pages/Roles/add";
import PjraPtw from "../pages/PjraPtw";
import PtwCreate from "../pages/PjraPtw/add";
import SdoPtwList from "../pages/SdoPtw";
import SdoPtwReview from "../pages/SdoPtw/add";
import XenPtwList from "../pages/XenPtw";
import XenPtwApprove from "../pages/XenPtw/approve";
import PdcPtwList from "../pages/PdcPtw";
import PdcPtwIssue from "../pages/PdcPtw/Issue";
import GridPreExecList from "../pages/GridPreExec";
import GridPreExecChecklist from "../pages/GridPreExec/PreExecution";
import PreStartList from "../pages/Execution";
import WorkInProgressPage from "../pages/WipPage";
import WorkInProgressViewPage from "@/pages/WipPage/view";
import PreStartForm from "../pages/Execution/prestart";
import Layout from "../themes";
import CompletionListPage from "@/pages/completion";
import CompletionDetailPage from "@/pages/completion/view";
import IncidentCreatePage from "@/pages/IncidentCreate";
import IncidentInvestigationPage from "@/pages/IncidentInvestigation";
import RegionsListPage from "@/pages/organization/regions";
import CirclesListPage from "@/pages/organization/circles";
import DivisionsListPage from "@/pages/organization/divisions";
import SubDivisionsListPage from "@/pages/organization/subdivisions";
import FeederListPage from "@/pages/organization/feeders";

import PTW_Issuer_Software from "@/pages/new/index5";
import IssuerInstructionsAck_Software from "@/pages/new/index6";
import CancellationRequest_Software from "@/pages/new/index7";
import Canvas9_GridIncharge_Software from "@/pages/new/index8";
import PTW_StepperWizard from "@/pages/ptw/StepperWizard";
import PTWPreviewPage from "@/pages/new/PTWPreviewPage";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  const routes = [
      {
      element: <ProtectedRoute />,   // ✅ Wrap all protected pages
      children: [
        
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Page />,
        },
        {
          path: "/users",
          element: <UsersListPage />,
        },
        {
          path: "/users/add",
          element: <UsersUpsertPage />,
        },
        {
          path: "/users/:id/edit",
          element: <UsersUpsertPage />,
        },
        {
          path: "/roles",
          element: <RolesListPage />,
        },
        {
          path: "/roles/add",
          element: <RoleFormPage />,
        },
        {
          path: "/pjra-ptw",
          element: <PjraPtw />,
        },
        {
          path: "/ptw/:id",
          element: <PTWPreviewPage />,
        },
        {
          path: "/pjra-ptw/add",
          element: <PtwCreate />,
        },
        {
          path: "/sdo-ptw",
          element: <SdoPtwList />,
        },
        {
          path: "/sdo-ptw/add",
          element: <SdoPtwReview />,
        },
        {
          path: "/xen-ptw",
          element: <XenPtwList />,
        },
        {
          path: "/xen-ptw/:id",
          element: <XenPtwApprove />,
        },
        {
          path: "/pdc-ptw",
          element: <PdcPtwList />,
        },
        {
          path: "/pdc-ptw/:id",
          element: <PdcPtwIssue />,
        },
        {
          path: "/grid-pre-exec",
          element: <GridPreExecList />,
        },
        {
          path: "/grid-pre-exec/:id",
          element: <GridPreExecChecklist />,
        },
        {
          path: "/pre-start",
          element: <PreStartList />,
        },
        {
          path: "/pre-start/:id",
          element: <PreStartForm />,
        },
        {
          path: "/work-inprogress",
          element: <WorkInProgressPage />,
        },
        {
          path: "/work-inprogress/view",
          element: <WorkInProgressViewPage />,
        },
        {
          path: "/completion",
          element: <CompletionListPage />,
        },
        {
          path: "/completion/:id",
          element: <CompletionDetailPage />,
        },
        {
          path: "/incident-create",
          element: <IncidentCreatePage />,
        },
        {
          path: "/incident-investigation",
          element: <IncidentInvestigationPage />,
        },
        {
          path: "/organization/regions",
          element: <RegionsListPage />,
        },
        {
          path: "/organization/circles",
          element: <CirclesListPage />,
        },
        {
          path: "/organization/divisions",
          element: <DivisionsListPage />,
        },
        {
          path: "/organization/subdivisions",
          element: <SubDivisionsListPage />,
        },
        {
          path: "/organization/feeders",
          element: <FeederListPage />,
        },
        {
          path: "/ptw",
          element: <PTW_StepperWizard />,
        },
    
        {
          path: "/5",
          element: <PTW_Issuer_Software />,
        },
          {
          path: "/6",
          element: <IssuerInstructionsAck_Software />,
        },
          {
          path: "/7",
          element: <CancellationRequest_Software />,
        },
          {
          path: "/8",
          element: <Canvas9_GridIncharge_Software />,
        },
      
 

        
       
      ],
    },
  ]},
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/error-page",
      element: <ErrorPage />,
    },
    {
      path: "*",
      element: <ErrorPage />,
    },
  ];

  return useRoutes(routes);
}

export default Router;
