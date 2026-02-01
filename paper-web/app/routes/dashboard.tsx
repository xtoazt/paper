import type { MetaFunction } from "@remix-run/node";
import Dashboard from "~/components/Dashboard";

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard - Paper Network" },
    { name: "description", content: "Manage your .paper domains, content, and network." },
  ];
};

export default function DashboardRoute() {
  return <Dashboard />;
}
