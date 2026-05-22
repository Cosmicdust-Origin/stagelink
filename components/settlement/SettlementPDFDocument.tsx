import path from "path";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SettlementMemberSummary } from "@/lib/types";

Font.register({
  family: "NanumGothic",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/NanumGothic-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public/fonts/NanumGothic-Bold.ttf"), fontWeight: "bold" },
  ],
});

const F = "NanumGothic";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: F, color: "#1a1a1a", backgroundColor: "#ffffff" },

  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#666666", marginBottom: 24 },

  memberBlock: { marginBottom: 20 },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1.5 solid #e8457a",
  },
  memberName: { fontSize: 11, fontWeight: "bold", flex: 1 },
  memberGroup: { fontSize: 9, color: "#666666" },

  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "0.5 solid #eeeeee",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "0.5 solid #eeeeee",
    backgroundColor: "#fafafa",
  },

  colType: { width: "22%" },
  colEvent: { width: "28%" },
  colDate: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "right" },
  colRate: { width: "8%", textAlign: "right" },
  colAmount: { width: "10%", textAlign: "right" },

  headText: { fontSize: 8, fontWeight: "bold", color: "#444444" },
  cellText: { fontSize: 8, color: "#333333" },
  cellMuted: { fontSize: 8, color: "#888888" },

  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    paddingRight: 6,
    borderTop: "1 solid #dddddd",
    gap: 8,
  },
  totalLabel: { fontSize: 9, color: "#555555" },
  totalAmount: { fontSize: 11, fontWeight: "bold", color: "#e8457a" },

  footer: { marginTop: 32, paddingTop: 10, borderTop: "0.5 solid #dddddd" },
  footerText: { fontSize: 8, color: "#aaaaaa" },

  summaryBox: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#fdf2f6",
    borderRadius: 4,
    borderLeft: "3 solid #e8457a",
  },
  summaryTitle: { fontSize: 9, fontWeight: "bold", color: "#c0365f", marginBottom: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  summaryName: { fontSize: 9 },
  summaryTotal: { fontSize: 9, fontWeight: "bold" },
});

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export function SettlementPDFDocument({
  month,
  members,
}: {
  month: string;
  members: SettlementMemberSummary[];
}) {
  const [year, mon] = month.split("-");
  const grandTotal = members.reduce((sum, m) => sum + m.total, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* 헤더 */}
        <Text style={s.title}>STAGELINK 정산서</Text>
        <Text style={s.subtitle}>
          {year}년 {Number(mon)}월 · 총 {members.length}명 · 합계 {fmt(Math.round(grandTotal))}원
        </Text>

        {/* 멤버별 요약 박스 */}
        <View style={s.summaryBox}>
          <Text style={s.summaryTitle}>정산 요약</Text>
          {members.map((m) => (
            <View key={m.member_id} style={s.summaryRow}>
              <Text style={s.summaryName}>{m.member_name}  ({m.group_name})</Text>
              <Text style={s.summaryTotal}>{fmt(Math.round(m.total))}원</Text>
            </View>
          ))}
        </View>

        {/* 멤버별 상세 내역 */}
        {members.map((member) => (
          <View key={member.member_id} style={s.memberBlock} wrap={false}>
            {/* 멤버 이름 헤더 */}
            <View style={s.memberHeader}>
              <Text style={s.memberName}>{member.member_name}</Text>
              <Text style={s.memberGroup}>{member.group_name}</Text>
            </View>

            {/* 테이블 헤더 */}
            <View style={s.tableHead}>
              <Text style={[s.headText, s.colType]}>특전 종류</Text>
              <Text style={[s.headText, s.colEvent]}>공연명</Text>
              <Text style={[s.headText, s.colDate]}>날짜</Text>
              <Text style={[s.headText, s.colQty]}>수량</Text>
              <Text style={[s.headText, s.colUnit]}>단가</Text>
              <Text style={[s.headText, s.colRate]}>비율</Text>
              <Text style={[s.headText, s.colAmount]}>정산액</Text>
            </View>

            {/* 내역 행 */}
            {member.breakdown.map((line, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.cellText, s.colType]}>{line.privilege_type}</Text>
                <Text style={[s.cellText, s.colEvent]}>{line.event_name}</Text>
                <Text style={[s.cellMuted, s.colDate]}>{line.event_date}</Text>
                <Text style={[s.cellText, s.colQty]}>{line.quantity}</Text>
                <Text style={[s.cellMuted, s.colUnit]}>{fmt(line.unit_price)}</Text>
                <Text style={[s.cellMuted, s.colRate]}>{Math.round(line.rate * 100)}%</Text>
                <Text style={[s.cellText, s.colAmount]}>{fmt(Math.round(line.amount))}</Text>
              </View>
            ))}

            {/* 합계 */}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>정산 합계</Text>
              <Text style={s.totalAmount}>{fmt(Math.round(member.total))}원</Text>
            </View>
          </View>
        ))}

        {/* 푸터 */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            본 정산서는 STAGELINK 시스템에서 자동 생성되었습니다. · {year}년 {Number(mon)}월 기준
          </Text>
        </View>
      </Page>
    </Document>
  );
}
