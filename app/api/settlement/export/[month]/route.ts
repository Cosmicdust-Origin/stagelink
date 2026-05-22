import { pdf, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { SettlementPDFDocument } from "@/components/settlement/SettlementPDFDocument";
import { getSettlementSummary } from "@/lib/api/settlement";
import { requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ month: string }> };

export async function GET(_: Request, { params }: Params) {
  const { month } = await params;
  const { supabase } = await requireRole(["admin"]);
  const members = await getSettlementSummary(supabase, month);
  const document = createElement(SettlementPDFDocument, { month, members }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(document).toBlob();

  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="stagelink-settlement-${month}.pdf"`,
    },
  });
}
