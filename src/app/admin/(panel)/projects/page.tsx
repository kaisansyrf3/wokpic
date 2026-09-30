import { ProjectsAdmin } from "@/components/admin/ProjectsAdmin";
import { listProjects } from "@/lib/supabase/admin-queries";

export default async function ProjectsAdminPage() {
  const projects = await listProjects();
  return <ProjectsAdmin projects={projects} />;
}
