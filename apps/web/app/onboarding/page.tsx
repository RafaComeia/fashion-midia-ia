'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface WizardData {
  name: string;
  slug: string;
  segment: string | null;
  logoUrl: string | null;
}

const SEGMENTS = [
  { value: 'casual', label: 'Casual', icon: '👕', description: 'Moda do dia a dia' },
  { value: 'festa', label: 'Festa', icon: '✨', description: 'Looks para ocasiões especiais' },
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Roupas esportivas e ativas' },
  { value: 'infantil', label: 'Infantil', icon: '🧸', description: 'Moda para crianças' },
  { value: 'executivo', label: 'Executivo', icon: '💼', description: 'Looks profissionais' },
  { value: 'praia', label: 'Praia', icon: '🌊', description: 'Moda praia e resort' },
  { value: 'noivas', label: 'Noivas', icon: '💍', description: 'Vestidos e acessórios nupciais' },
  { value: 'plus_size', label: 'Plus Size', icon: '🌸', description: 'Moda inclusiva' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({ name: '', slug: '', segment: null, logoUrl: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Redireciona se já tem workspace
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.workspace_id) {
        router.replace('/dashboard');
      }
    });
  }, [supabase, router]);

  // Verifica slug com debounce
  const checkSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 2) {
        setSlugAvailable(null);
        return;
      }
      setCheckingSlug(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/workspaces/check-slug/${slug}`);
        const json = (await res.json()) as { available: boolean };
        setSlugAvailable(json.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkSlug(data.slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [data.slug, checkSlug]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleNameChange = (value: string) => {
    setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
    setSlugAvailable(null);
  };

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setData((prev) => ({ ...prev, slug: clean }));
    setSlugAvailable(null);
  };

  const handleLogoChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo deve ter no máximo 5MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const uploadLogo = async (workspaceId: string): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split('.').pop() ?? 'png';
    const path = `${workspaceId}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('workspace-assets')
      .upload(path, logoFile, { upsert: true });
    if (uploadError) return null;
    const { data: urlData } = supabase.storage.from('workspace-assets').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          segment: data.segment ?? undefined,
          logoUrl: data.logoUrl ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? 'Erro ao criar workspace');
      }

      const workspace = (await res.json()) as { id: string };

      // Upload da logo se houver
      if (logoFile) {
        const logoUrl = await uploadLogo(workspace.id);
        if (logoUrl) {
          // Atualiza logo_url (best-effort, não bloqueia o fluxo)
          await fetch(`${apiUrl}/workspaces/${workspace.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ logoUrl }),
          }).catch(() => null);
        }
      }

      // Refresh da sessão para pegar o novo JWT com workspace_id
      await supabase.auth.refreshSession();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setLoading(false);
    }
  };

  // ─── Progresso ──────────────────────────────────────────────────────────────

  const canProceedStep1 =
    data.name.length >= 2 && data.slug.length >= 2 && slugAvailable === true;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">Passo {step} de 3</span>
            <span className="text-sm text-zinc-500">
              {step === 1 ? 'Nome da marca' : step === 2 ? 'Segmento' : 'Logo'}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ─── Passo 1: Nome e Slug ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Qual é o nome da sua marca?
                </h1>
                <p className="text-sm text-zinc-500">
                  Esse será o nome exibido na plataforma e nas campanhas.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nome da marca
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Mazzara Fashion"
                    maxLength={100}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Slug (URL da marca)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={data.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="mazzara-fashion"
                      maxLength={100}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    {data.slug.length >= 2 && (
                      <span className="absolute right-3 top-2.5 text-sm">
                        {checkingSlug ? '⏳' : slugAvailable === true ? '✅' : slugAvailable === false ? '❌' : ''}
                      </span>
                    )}
                  </div>
                  {slugAvailable === false && (
                    <p className="text-xs text-red-600">Esse slug já está em uso. Tente outro.</p>
                  )}
                  <p className="text-xs text-zinc-400">
                    Apenas letras minúsculas, números e hífens. Gerado automaticamente a partir do nome.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* ─── Passo 2: Segmento ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Qual é o segmento da sua marca?
                </h1>
                <p className="text-sm text-zinc-500">
                  Isso ajuda a IA a gerar campanhas mais relevantes para o seu estilo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SEGMENTS.map((seg) => (
                  <button
                    key={seg.value}
                    onClick={() => setData((prev) => ({ ...prev, segment: seg.value }))}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                      data.segment === seg.value
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-2xl">{seg.icon}</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {seg.label}
                    </span>
                    <span className="text-xs text-zinc-500">{seg.description}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  {data.segment ? 'Continuar' : 'Pular'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Passo 3: Logo ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Adicione a logo da sua marca
                </h1>
                <p className="text-sm text-zinc-500">
                  JPG, PNG, SVG ou WebP. Máximo 5MB. Você pode adicionar depois.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <div
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                      logoPreview
                        ? 'border-zinc-300 dark:border-zinc-600'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Preview da logo"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-lg object-contain"
                        unoptimized
                      />
                    ) : (
                      <>
                        <div className="text-4xl text-zinc-300 dark:text-zinc-600">🖼️</div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Clique para selecionar
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">ou arraste a imagem aqui</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoChange(file);
                    }}
                  />
                </label>

                {logoPreview && (
                  <button
                    onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    Remover imagem
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Criando...' : logoFile ? 'Concluir' : 'Pular e concluir'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
