import { useEffect, useState } from 'react';
import { getCohorts, getCohort } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, Button } from '../components/ui';
import { ArrowLeft, Users2 } from 'lucide-react';

function CohortDetail({ cohortId, onBack, onNavigate }) {
  const [data, setData] = useState(null);
  useEffect(() => { getCohort(cohortId).then(setData); }, [cohortId]);
  if (!data) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> Danh sách nhóm học</button>
      <Card>
        <h2 className="text-xl font-extrabold text-[#101A24]">{data.cohort.name}</h2>
        <p className="text-sm text-[#666] mt-1">{data.learners.length} học viên · {data.mockExams.length} vòng thi thử</p>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={() => onNavigate('exams')}>Xem Mock Exam Analytics</Button>
          <Button variant="secondary" onClick={() => onNavigate('learners')}>Xem học viên cần hỗ trợ</Button>
        </div>
      </Card>
      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-3">Vòng thi thử</h3>
        <div className="flex flex-col gap-2">
          {data.mockExams.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#101A24]/10 text-sm">
              <span className="font-bold text-[#101A24]">{m.title}</span>
              <span className="text-[#888]">Vòng {m.round_number}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-3">Học viên</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.learners.map((l) => (
            <div key={l.id} className="px-3 py-2 rounded-lg bg-[#F5F6F8] text-sm font-bold text-[#101A24]">{l.username}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Cohorts({ onNavigate }) {
  const [cohorts, setCohorts] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { getCohorts().then(setCohorts); }, []);
  if (!cohorts) return <Spinner />;
  if (selected) return <CohortDetail cohortId={selected} onBack={() => setSelected(null)} onNavigate={onNavigate} />;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Quản lý nhóm học và theo dõi tiến độ của từng nhóm.">Nhóm học</SectionTitle>
      {cohorts.length === 0 ? <EmptyState>Chưa có nhóm học nào.</EmptyState> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <button onClick={() => setSelected(c.id)} className="text-left w-full flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B9E7EF] flex items-center justify-center shrink-0"><Users2 size={20} /></div>
                <div>
                  <h3 className="font-extrabold text-[#101A24]">{c.name}</h3>
                  <p className="text-sm text-[#666] mt-1">{c.courseTitle}</p>
                  <p className="text-xs text-[#888] mt-1">{c.learnerCount} học viên</p>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
