import { useEffect, useState } from 'react';
import { getLearnerProfile } from '../../utils/studioApi';
import { Card, Spinner, Stat } from '../components/ui';
import { ArrowLeft } from 'lucide-react';

const TREND_LABEL = {
  high_stable: 'Ổn định ở mức cao', improving: 'Đang cải thiện', plateauing: 'Chững lại',
  declining: 'Đang giảm', inconsistent: 'Không ổn định', insufficient_data: 'Chưa đủ dữ liệu'
};

export default function LearnerProfile({ learnerId, onBack }) {
  const [data, setData] = useState(null);
  useEffect(() => { getLearnerProfile(learnerId).then(setData); }, [learnerId]);
  if (!data) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> Quay lại</button>
      <Card>
        <h2 className="text-xl font-extrabold text-[#101A24]">{data.learner.username}</h2>
        <p className="text-sm text-[#666] mt-1">{data.insight}</p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Điểm gần nhất" value={data.latestScore ?? '—'} />
        <Stat label="Xu hướng" value={TREND_LABEL[data.scoreTrend] || data.scoreTrend} />
        <Stat label="Lỗi phổ biến" value={data.commonMistakeType || '—'} />
        <Stat label="Lịch sử thi thử" value={data.mockExamHistory.join(' → ') || '—'} />
      </div>

      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-3">Hiệu suất theo chủ đề</h3>
        <div className="flex flex-col gap-2">
          {data.topicPerformance.map((t) => (
            <div key={t.topic} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#101A24]/10 text-sm">
              <span className="font-bold text-[#101A24]">{t.topic}</span>
              <span className="text-[#888]">{t.correctRate}% đúng</span>
            </div>
          ))}
        </div>
      </Card>

      {data.interventions.length > 0 && (
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-3">Chặng cứu hộ đã giao</h3>
          <div className="flex flex-col gap-2">
            {data.interventions.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#101A24]/10 text-sm">
                <span className="font-bold text-[#101A24]">{iv.title}</span>
                <span className="text-[#888]">{iv.completed_at ? 'Đã hoàn thành' : 'Đang giao'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
