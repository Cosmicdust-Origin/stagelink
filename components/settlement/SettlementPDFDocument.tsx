import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SettlementMemberSummary } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#111" },
  title: { fontSize: 18, marginBottom: 12 },
  member: { marginTop: 14, paddingTop: 10, borderTop: "1 solid #ccc" },
  row: { flexDirection: "row", borderBottom: "1 solid #eee", paddingVertical: 4 },
  cell: { flex: 1 },
  amount: { flex: 1, textAlign: "right" },
  total: { marginTop: 6, textAlign: "right", fontSize: 12 },
});

export function SettlementPDFDocument({
  month,
  members,
}: {
  month: string;
  members: SettlementMemberSummary[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>STAGELINK Settlement {month}</Text>
        {members.map((member) => (
          <View key={member.member_id} style={styles.member}>
            <Text>
              {member.member_name} / {member.group_name}
            </Text>
            <View style={styles.row}>
              <Text style={styles.cell}>Type</Text>
              <Text style={styles.cell}>Qty</Text>
              <Text style={styles.cell}>Unit</Text>
              <Text style={styles.cell}>Rate</Text>
              <Text style={styles.amount}>Amount</Text>
            </View>
            {member.breakdown.map((line) => (
              <View key={`${member.member_id}-${line.privilege_type}`} style={styles.row}>
                <Text style={styles.cell}>{line.privilege_type}</Text>
                <Text style={styles.cell}>{line.quantity}</Text>
                <Text style={styles.cell}>{line.unit_price}</Text>
                <Text style={styles.cell}>{Math.round(line.rate * 100)}%</Text>
                <Text style={styles.amount}>{Math.round(line.amount).toLocaleString("ko-KR")}</Text>
              </View>
            ))}
            <Text style={styles.total}>Total {Math.round(member.total).toLocaleString("ko-KR")} KRW</Text>
          </View>
        ))}
        <Text style={{ marginTop: 24 }}>This settlement sheet is generated from STAGELINK records.</Text>
      </Page>
    </Document>
  );
}
