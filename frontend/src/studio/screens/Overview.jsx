import { useEffect, useState } from 'react';
import { getOverview } from '../../utils/studioApi';
import { Card, Stat, Spinner, Button } from '../components/ui';
import { TrendChart, GaugeChart } from '../components/charts';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { useT } from '../../translations';

export default function Overview({ onNavigate }) {
  const t = useT();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOverview().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Card className="text-sm text-red-600">{error}</Card>;
  if (!data) return <Spinner label={t.studioLoading} />;

  const event = data.activeCourses === 0 ? 'EMPTY_COURSE' : 'STUDIO_GREETING';

  return (
    <div className="flex flex-col gap-6">
      <StudioLlamaBubble event={event} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label={t.studioStatActiveCourses} value={data.activeCourses} />
        <Stat label={t.studioStatActiveLearners} value={data.activeLearners} />
        <Stat label={t.studioStatAvgScore} value={data.averageMockExamScore ?? '—'} />
        <Stat label={t.studioStatPassRate} value={data.estimatedPassRate != null ? `${data.estimatedPassRate}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <h3 className="font-extrabold text-[#101A24] mb-4">{t.studioMockExamTrendTitle}</h3>
          <TrendChart
            data={data.mockExamTrend}
            series={[
              { key: 'averageScore', label: t.studioTrendSeriesAvgScore, color: '#1E9E5A' },
              { key: 'passRate', label: t.studioTrendSeriesPassRate, color: '#2178C4' }
            ]}
            xKey="round"
            formatX={(v) => t.studioRoundLabel.replace('{n}', v)}
            emptyMessage={t.studioMockExamTrendEmpty}
          />
        </Card>
        <Card className="flex items-center justify-center">
          <GaugeChart value={data.estimatedPassRate} label={t.studioStatPassRate} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-2">{t.studioNeedsReviewTitle}</h3>
          <p className="text-sm text-[#666]">{t.studioNeedsReviewDesc.replace('{count}', data.coursesNeedingReview)}</p>
          <Button variant="secondary" className="mt-4" onClick={() => onNavigate('courses')}>{t.studioViewCourses}</Button>
        </Card>
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-2">{t.studioClustersOpenTitle}</h3>
          <p className="text-sm text-[#666]">{t.studioClustersOpenDesc.replace('{count}', data.misconceptionClustersOpen)}</p>
          <Button variant="secondary" className="mt-4" onClick={() => onNavigate('insights')}>{t.studioViewInsights}</Button>
        </Card>
      </div>

      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-4">{t.studioYourCourses}</h3>
        {data.courses.length === 0 ? (
          <p className="text-sm text-[#888]">{t.studioNoCoursesShort}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.courses.map((c) => (
              <button key={c.id} onClick={() => onNavigate('courses')} className="flex items-center justify-between p-3 rounded-xl border border-[#101A24]/10 hover:bg-[#F5F6F8] text-left">
                <span className="font-bold text-[#101A24]">{c.title}</span>
                <span className="flex items-center gap-3 text-xs font-bold text-[#888]">
                  <span>{c.status}</span>
                  <span>{t.studioHealthLabel.replace('{score}', c.healthScore ?? '—')}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
