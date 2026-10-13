'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

export interface FeedItem {
  id: string;
  username: string;
  challengeTitle: string;
  category: string;
  points: number;
  solvedAt: string;
  isFirstBlood: boolean;
}

interface LiveSolveFeedProps {
  feed?: FeedItem[];
  initialFeed?: FeedItem[];
}

export default function LiveSolveFeed({ feed: externalFeed, initialFeed }: LiveSolveFeedProps) {
  const effectiveFeed = externalFeed || initialFeed;
  const [feedData, setFeedData] = useState<FeedItem[]>(effectiveFeed || []);

  useEffect(() => {
    if (!effectiveFeed) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 10000);
      return () => clearInterval(interval);
    } else {
      setFeedData(effectiveFeed);
    }
  }, [effectiveFeed]);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/scoreboard');
      const data = await res.json();
      if (data.feed) {
        setFeedData(data.feed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
        {feedData.length === 0 ? (
          <p className="text-xs font-mono-code text-slate-400 text-center py-6">
            No solve telemetry recorded yet.
          </p>
        ) : (
          feedData.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border text-xs font-mono-code transition-all ${
                item.isFirstBlood
                  ? 'bg-rose-950/40 border-rose-800/80 text-white'
                  : 'bg-[#0b0f19] border-[#1e293b] text-slate-300 hover:border-[#334155]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">@{item.username}</span>
                  {item.isFirstBlood && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-600 text-white font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> FIRST BLOOD
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(item.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="truncate">
                  Solved <strong className="text-slate-200">{item.challengeTitle}</strong> ({item.category})
                </span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2">+{item.points} PTS</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
