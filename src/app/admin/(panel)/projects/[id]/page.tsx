import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { requireAdminUser } from "@/lib/auth";
import { getProjectForEdit } from "@/lib/supabase/admin-queries";

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminUser(`/admin/projects/${id}`);

  const project = await getProjectForEdit(id);
  if (!project) notFound();

  return (
    <ProjectEditor
      project={{
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        description: project.description,
        published: project.published,
      }}
      images={project.images}
      publicUrl={project.published ? `/works/${project.slug}` : null}
    />
  );
}
