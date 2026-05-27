import { Suspense } from 'react';
import { PuzzleGame } from '@/components/puzzle/PuzzleGame';

export const metadata = {
  title: 'ThinkGrid — Logic Puzzle',
  description: 'Chọn và chơi các câu đố logic ThinkGrid (4×4 đến 8×8) trên toiladuykhanh.com',
};

export default function PuzzlePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải puzzle…</p>}>
        <PuzzleGame />
      </Suspense>
    </main>
  );
}
