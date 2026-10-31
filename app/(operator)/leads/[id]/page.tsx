"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LeadEditor } from "@/src/components/LeadEditor";
import { PageHeading } from "@/src/components/WorkspaceDesign";
import { useOperatorLead } from "@/src/hooks/useOperatorLeads";
import { errorText } from "@/src/lib/format";

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOperatorLead(id);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/stream" className="text-xs font-semibold text-blue-700">
        ← Oqimga qaytish
      </Link>
      <PageHeading
        eyebrow="Mijoz bilan ishlash"
        title="Leadni qayta ishlash"
        description="Bog'laning, ma'lumotlarni tekshiring va buyurtmani tasdiqlang."
      />
      {query.isLoading && (
        <Loader2
          className="mx-auto animate-spin"
          aria-label="Lead yuklanmoqda"
        />
      )}
      {query.error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          {errorText(query.error, "Lead yuklanmadi")}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void query.refetch()}
          >
            Qayta urinish
          </button>
        </p>
      )}
      {query.data && <LeadEditor key={query.data._id} lead={query.data} />}
    </div>
  );
}
