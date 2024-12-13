import { RouteObject } from "react-router-dom";
import Dashboard from "../views/Dashboard";
import Login from "../views/Login";

type Props = {
    title: string;
    element: React.ReactNode;
  }

  export const ROUTES: Array<RouteObject> = [
    {
        path: "/dashboard",
        element: <Dashboard />
    },
    {
        path: "/mclgs",
        element: <Dashboard />
    },
    {
        path: "/authenticationconfig",
        element: <Dashboard />
    },
    {
        path: "/permissionmanage",
        element: <Dashboard />
    },
    {
        path: "/dusernmanage",
        element: <Dashboard />
    },
    {
        path: "/managetemplate",
        element: <Dashboard />
    },
    {
        path: "/templates",
        element: <Dashboard />
    },
    {
        path: "/managemodel",
        element: <Dashboard />
    },
    {
        path: "/models",
        element: <Dashboard />
    },
    {
        path: "/modeldoc",
        element: <Dashboard />
    },
    {
        path: "/listentities",
        element: <Dashboard />
    },
    {
        path: "/relations",
        element: <Dashboard />
    },
    {
        path: "/addentity",
        element: <Dashboard />
    },
    {
        path: "/taxonomy",
        element: <Dashboard />
    },
    {
        path: "/importfromfile",
        element: <Dashboard />
    },
    {
        path: "/querybuilder",
        element: <Dashboard />
    },
    {
        path: "/hooks",
        element: <Dashboard />
    },
    {
        path: "/listconfig",
        element: <Dashboard />
    },
    {
        path: "/configurator",
        element: <Dashboard />
    },
    {
        path: "/importcronjob",
        // element: <Importcronjob />
    },
    {
        path: "/opennessearch",
        element: <Dashboard />
    },
    {
        path: "/sync",
        element: <Dashboard />
    },
    {
        path: "/fixproblems",
        element: <Dashboard />
    },
    {
        path: "/demolist",
        element: <Dashboard />
    },
    {
        path: "/demosingle",
        element: <Dashboard />
    },
    {
        path: "/singlebyurl",
        element: <Dashboard />
    },
    {
        path: "/demomap",
        element: <Dashboard />
    },
    {
        path: "/querybuilder",
        element: <Dashboard />
    },
    {
        path: "/demomanager",
        element: <Dashboard />
    },
    {
        path: "/modelsdoc",
        element: <Dashboard />
    },
    {
        path: "/modelsdoc",
        element: <Dashboard />
    },
    {
        path: "/redisdoc",
        element: <Dashboard />
    },
    {
        path: "/login",
        element: <Login />
    }
  ]