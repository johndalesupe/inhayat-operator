"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LeadEditor } from "@/src/components/LeadEditor";

import { useOperatorLead } from "@/src/hooks/useOperatorLeads";
import { errorText } from "@/src/lib/format";

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOperatorLead(id);
  return (
    <div className="editing-workspace">
      <Link href="/stream" className="form-back">
        ← Oqimga qaytish
      </Link>
      <header className="editing-heading">
        <h1>Leadni qayta ishlash</h1>
        <p>Ma?lumotlarni tekshiring va tasdiqlang.</p>
      </header>
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
