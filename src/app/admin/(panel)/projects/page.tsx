import type { Metadata } from "next";

import { ProjectsAdmin } from "@/components/admin/ProjectsAdmin";
import { listProjects } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsAdminPage() {
  const projects = await listProjects();
  return <ProjectsAdmin projects={projects} />;
}
