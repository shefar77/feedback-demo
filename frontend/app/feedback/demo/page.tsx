import { Suspense } from 'react';
import FeedbackFlow from '../../../components/Feedback';

interface Props {
  params: { placeId: string };
  searchParams: { biz?: string; category?: string; lang?: string };
}

export default function FeedbackPage({ params, searchParams }: Props) {
  const context = {
    placeId: "ChIJK9ZfSh-6bTkRJUzXVIgzQTc",
    bizName: searchParams.biz ?? 'O P Maggi Shop',
    category: searchParams.category ?? 'Hotel',
    lang: searchParams.lang ?? 'en',
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <FeedbackFlow context={context} />
    </Suspense>
  );
}