'use client';

import Link from 'next/link';
import { BarChart2, ImageIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkspace } from '@/hooks/useWorkspace';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tooltip: string;
}

function KpiCard({ title, value, icon: Icon, tooltip }: KpiCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Card className="cursor-default">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
            <Icon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default function DashboardPage() {
  const { workspace, loading } = useWorkspace();

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Boas-vindas */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {loading ? 'Carregando...' : `Olá, ${workspace?.name ?? 'bem-vindo'} 👋`}
        </h1>
        <p className="text-sm text-zinc-500">
          Aqui está um resumo da sua plataforma de campanhas com IA.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total de Campanhas"
          value={0}
          icon={ImageIcon}
          tooltip="Número total de campanhas criadas no seu workspace"
        />
        <KpiCard
          title="Assets Gerados"
          value={0}
          icon={BarChart2}
          tooltip="Imagens e vídeos gerados pela IA até agora"
        />
        <KpiCard
          title="Engajamento Médio"
          value="--"
          icon={TrendingUp}
          tooltip="Disponível após conectar suas redes sociais nas Configurações"
        />
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 flex flex-col items-center text-center gap-4">
        <div className="text-4xl">✨</div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Crie sua primeira campanha
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm">
            Use a IA para gerar imagens e vídeos profissionais para sua marca em segundos.
          </p>
        </div>
        <Link
          href="/dashboard/campanhas"
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-3 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Criar campanha
        </Link>
      </div>
    </div>
  );
}
