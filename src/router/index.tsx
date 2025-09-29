import { useRoutes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ErrorPage from "../pages/ErrorPage";
import DashboardOverview1 from "../pages/DashboardOverview1";
import Users from "../pages/Users";
import AddUserPage from "../pages/Users/add";
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

function Router() {
  const routes = [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <DashboardOverview1 />,
        },
        {
          path: "/users",
          element: <Users />,
        },
        {
          path: "/users/add",
          element: <AddUserPage />,
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
        
       
      ],
    },
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
