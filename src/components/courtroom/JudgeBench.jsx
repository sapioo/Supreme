import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const categories = [
  { key: 'legalReasoning', label: 'Legal Reasoning', icon: '§' },
  { key: 'useOfPrecedent', label: 'Use of Precedent', icon: '⚖' },
  { key: 'persuasiveness', label: 'Persuasiveness', icon: '◈' },
  { key: 'constitutionalValidity', label: 'Constitutional Validity', icon: '☆' },
];

export default function JudgeBench({ roundScores }) {
  const [animatedRound, setAnimatedRound] = useState(0);
  const [commentRound, setCommentRound] = useState(0);

  const latestScore = roundScores.length > 0 ? roundScores[roundScores.length - 1] : null;
  const latestRound = latestScore ? latestScore.round : 0;
  const shouldShow = Boolean(latestScore);
  const animateScores = shouldShow && animatedRound === latestRound;
  const showComment = shouldShow && commentRound === latestRound;

  useEffect(() => {
    if (shouldShow) {
      const t1 = setTimeout(() => setAnimatedRound(latestRound), 200);
      const t2 = setTimeout(() => setCommentRound(latestRound), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [shouldShow, latestRound]);

  const getTotalScore = (scoreObj) => {
    if (!scoreObj) return 0;
    return Object.values(scoreObj).reduce((a, b) => a + b, 0);
  };

  return (
    <Card className="border-zinc-800 bg-[#171717] shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center gap-3">
          <Separator className="flex-1 bg-zinc-800" />
          <span className="text-zinc-500 text-lg">⚜</span>
          <Separator className="flex-1 bg-zinc-800" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <CardTitle className="font-sans text-lg text-zinc-100">Judge&apos;s Bench</CardTitle>
          {latestScore && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-zinc-700 text-zinc-500">
              Round {latestScore.round} Scores
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {latestScore ? (
          <div className="space-y-5">
            {/* Score bars */}
            <div className="space-y-4">
              {categories.map((cat) => {
                const userVal = latestScore.userScore[cat.key] || 0;
                const aiVal = latestScore.aiScore[cat.key] || 0;
                return (
                  <div key={cat.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-sm">{cat.icon}</span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-200 w-6 text-center">{userVal}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-200 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: animateScores ? `${userVal}%` : '0%' }}
                          />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-600">vs</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: animateScores ? `${aiVal}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-400 w-6 text-center">{aiVal}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="bg-zinc-800" />

            {/* Totals */}
            <div className="flex items-center justify-center gap-4 rounded-md border border-zinc-800 bg-zinc-900/80 px-4 py-2">
              <div className="text-center flex-1">
                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 block mb-1">You</span>
                <span className="font-sans text-2xl text-zinc-100">{getTotalScore(latestScore.userScore)}</span>
              </div>
              <Separator orientation="vertical" className="h-8 bg-zinc-700" />
              <div className="text-center flex-1">
                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 block mb-1">AI Counsel</span>
                <span className="font-sans text-2xl text-zinc-400">{getTotalScore(latestScore.aiScore)}</span>
              </div>
            </div>

            {/* Judge comment */}
            {showComment && latestScore.judgeComment && (
              <div className="flex items-start gap-3 rounded-md border border-zinc-700 bg-zinc-900/70 p-3">
                <span className="text-lg">🔨</span>
                <p className="text-sm text-zinc-300 italic leading-relaxed">&ldquo;{latestScore.judgeComment}&rdquo;</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-500 italic">The Bench awaits the first round of arguments...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
