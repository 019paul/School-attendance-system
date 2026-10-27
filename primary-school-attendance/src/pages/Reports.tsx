import { useMemo, useState } from "react";
import { Download, TrendingUp, Users, UserCheck, UserX } from "lucide-react";
import type { AttendanceRecord, Student } from "../types";
import { formatDate, todayISO } from "../utils/storage";
import { EmptyState } from "./Dashboard";

export function Reports({ students, records }: { students: Student[]; records: AttendanceRecord[] }) {
  const [date, setDate] = useState(todayISO());
  const [classFilter, setClassFilter] = useState("All classes");
  const filteredStudents = students.filter((student) => classFilter === "All classes" || student.className === classFilter);
  const dailyRecords = records.filter((record) => record.date === date && (classFilter === "All classes" || record.className === classFilter));
  const present = dailyRecords.filter((record) => record.status === "Present" || record.status === "Late").length;
  const absent = dailyRecords.filter((record) => record.status === "Absent").length;
  const percentage = dailyRecords.length ? Math.round((present / dailyRecords.length) * 100) : 0;
  const perClass = useMemo(() => ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"].filter((name) => classFilter === "All classes" || name === classFilter).map((name) => {
    const classRecords = records.filter((record) => record.date === date && record.className === name);
    const classPresent = classRecords.filter((record) => record.status === "Present" || record.status === "Late").length;
    return { name, students: students.filter((student) => student.className === name).length, recorded: classRecords.length, present: classPresent, absent: classRecords.filter((record) => record.status === "Absent").length, rate: classRecords.length ? Math.round((classPresent / classRecords.length) * 100) : 0 };
  }), [records, students, date, classFilter]);
  function exportCsv() {
    const rows = [["Class", "Students", "Recorded", "Present/Late", "Absent", "Attendance rate"], ...perClass.map((item) => [item.name, item.students, item.recorded, item.present, item.absent, `${item.rate}%`])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })); const link = document.createElement("a"); link.href = url; link.download = `attendance-report-${date}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="page-content"><div className="page-heading"><div><div className="eyebrow">INSIGHTS</div><h1>Attendance reports</h1><p>Review daily attendance totals and class performance.</p></div><button className="button button-secondary" onClick={exportCsv}><Download size={17} /> Export report</button></div>
    <section className="panel report-filters"><div className="control-field"><label htmlFor="report-date">Report date</label><input id="report-date" type="date" value={date} max={todayISO()} onChange={(event) => setDate(event.target.value)} /></div><div className="control-field"><label htmlFor="report-class">Class</label><select id="report-class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option>All classes</option>{["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="report-date-label">Report for <strong>{formatDate(date)}</strong></div></section>
    <div className="stats-grid report-stats"><ReportCard icon={<Users size={20} />} label="Students in scope" value={filteredStudents.length} tone="green" /><ReportCard icon={<UserCheck size={20} />} label="Present / late" value={dailyRecords.length ? present : "—"} tone="blue" /><ReportCard icon={<UserX size={20} />} label="Absent" value={dailyRecords.length ? absent : "—"} tone="orange" /><ReportCard icon={<TrendingUp size={20} />} label="Attendance rate" value={dailyRecords.length ? `${percentage}%` : "—"} tone="purple" /></div>
    <section className="panel"><div className="panel-heading"><div><h2>Class-by-class summary</h2><p>Attendance for {formatDate(date)}</p></div></div>
      {dailyRecords.length ? <div className="table-wrap"><table><thead><tr><th>Class</th><th>Students</th><th>Recorded</th><th>Present / late</th><th>Absent</th><th>Attendance rate</th></tr></thead><tbody>{perClass.map((item) => <tr key={item.name}><td><strong>{item.name}</strong></td><td>{item.students}</td><td>{item.recorded}</td><td>{item.present}</td><td>{item.absent}</td><td><div className="rate-cell"><div className="mini-bar"><span style={{ width: `${item.rate}%` }} /></div><strong>{item.recorded ? `${item.rate}%` : "—"}</strong></div></td></tr>)}</tbody></table></div> : <EmptyState title="No report data for this date" description="Save attendance for one or more classes to see report totals." />}
    </section><div className="info-note"><TrendingUp size={18} /><p>Attendance rate is calculated from recorded students only. “Late” counts as present; “Excused” is shown separately and is not counted as absent.</p></div>
  </div>;
}
function ReportCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">For selected date and class</div></div>; }