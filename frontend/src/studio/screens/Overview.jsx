import { useEffect, useState } from 'react';
import { getOverview } from '../../utils/studioApi';
import { Card, Stat, Spinner, Button } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';

export default function Overview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOverview().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Card className="text-sm text-red-600">{error}</Card>;
  if (!data) return <Spinner />;

  const event = data.activeCourses === 0 ? 'EMPTY_COURSE' : 'STUDIO_GREETING';

  return (
    <div className="flex flex-col gap-6">
      <StudioLlamaBubble event={event} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Khóa học đang mở" value={data.activeCourses} />
        <Stat label="Học viên đang học" value={data.activeLearners} />
        <Stat label="Điểm TB thi thử gần nhất" value={data.averageMockExamScore ?? '—'} />
        <Stat label="Tỷ lệ ước tính đạt" value={data.estimatedPassRate != null ? `${data.estimatedPassRate}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-2">Cần bạn xem lại</h3>
          <p className="text-sm text-[#666]">{data.coursesNeedingReview} khóa học đang ở bản nháp hoặc có health score dưới 70.</p>
          <Button variant="secondary" className="mt-4" onClick={() => onNavigate('courses')}>Xem khóa học</Button>
        </Card>
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-2">Cụm nhầm lẫn đang mở</h3>
          <p className="text-sm text-[#666]">{data.misconceptionClustersOpen} cụm nhầm lẫn chưa được xử lý bằng Rescue Expedition.</p>
          <Button variant="secondary" className="mt-4" onClick={() => onNavigate('insights')}>Xem Insights</Button>
        </Card>
      </div>

      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-4">Khóa học của bạn</h3>
        {data.courses.length === 0 ? (
          <p className="text-sm text-[#888]">Chưa có khóa học nào.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.courses.map((c) => (
              <button key={c.id} onClick={() => onNavigate('courses')} className="flex items-center justify-between p-3 rounded-xl border border-[#101A24]/10 hover:bg-[#F5F6F8] text-left">
                <span className="font-bold text-[#101A24]">{c.title}</span>
                <span className="flex items-center gap-3 text-xs font-bold text-[#888]">
                  <span>{c.status}</span>
                  <span>Health {c.healthScore ?? '—'}/100</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
