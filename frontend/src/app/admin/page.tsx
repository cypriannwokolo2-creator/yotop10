'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { Users, FileText, CheckCircle, MessageSquare } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.adminGetStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4">Loading stats...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Approved Posts', value: stats.totalPosts || 0, icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Pending Approval', value: stats.pendingPosts || 0, icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Total Comments', value: stats.totalComments || 0, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time platform metrics and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{stat.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
