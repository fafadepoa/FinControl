import { notFound } from "next/navigation";
import { listCompanies } from "@/lib/actions/companies";
import { getCollaboratorForEdit } from "@/lib/actions/users";
import { CollaboratorEditClient } from "./collaborator-edit-client";

export default async function EditCollaboratorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [u, companies] = await Promise.all([getCollaboratorForEdit(userId), listCompanies()]);
  if (!u) notFound();

  const linkedCompanyIds = u.userCompanies.map((uc) => uc.companyId);
  const displayName = u.displayName?.trim() || u.email.split("@")[0] || "";

  return (
    <div className="mx-auto max-w-5xl py-2 md:py-6">
      <CollaboratorEditClient
        userId={u.id}
        displayName={displayName}
        email={u.email}
        linkedCompanyIds={linkedCompanyIds}
        companies={companies}
        listHref="/admin/users"
      />
    </div>
  );
}
