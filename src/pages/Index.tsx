import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { ImageUploadZone } from '@/components/ImageUploadZone'
import { PageThumbnail } from '@/components/PageThumbnail'
import { PagePreviewModal } from '@/components/PagePreviewModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { generatePranchaPdf, downloadPdf } from '@/lib/pdf/generator'
import type { BoardData } from '@/lib/pdf/generator'
import { saveProject, getProjectById, getProjectFileUrl } from '@/services/projects'
import type { ProjectRecord } from '@/services/projects'
import { Download, Save, Check, AlertCircle, Loader2, FileCheck2, Sparkles } from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Form states
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [cliente, setCliente] = useState('')
  const [modelo, setModelo] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])
  const [vendedor, setVendedor] = useState('Gustavo Tibério')
  const [projeto, setProjeto] = useState('Corteplan Concept. AI Rendered.')
  const [responsavel, setResponsavel] = useState('Gustavo Tibério')
  const [includeAmbiente, setIncludeAmbiente] = useState(true)

  // Files & Previews
  const [renderFile, setRenderFile] = useState<File | null>(null)
  const [renderPreview, setRenderPreview] = useState<string | null>(null)

  const [ambienteFile, setAmbienteFile] = useState<File | null>(null)
  const [ambientePreview, setAmbientePreview] = useState<string | null>(null)

  const [desenhoFile, setDesenhoFile] = useState<File | null>(null)
  const [desenhoPreview, setDesenhoPreview] = useState<string | null>(null)

  // Validation errors
  const [errors, setErrors] = useState<{
    render?: string
    desenho?: string
  }>({})

  // Loading states
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  // Modal preview state
  const [modalPage, setModalPage] = useState<{
    isOpen: boolean
    pageNumber: number
    type: 'cover' | 'render' | 'ambiente' | 'desenho'
    title: string
    imageUrl?: string | null
  }>({
    isOpen: false,
    pageNumber: 1,
    type: 'cover',
    title: 'Capa',
    imageUrl: null,
  })

  // Check if opening an existing project from query param ?edit=ID
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const editId = searchParams.get('edit')

    if (editId) {
      loadExistingProject(editId)
    }
  }, [location.search])

  const loadExistingProject = async (id: string) => {
    setIsLoadingProject(true)
    try {
      const p = await getProjectById(id)
      setProjectId(p.id)
      setCliente(p.cliente || '')
      setModelo(p.modelo || '')
      setData(p.data || new Date().toISOString().split('T')[0])
      setVendedor(p.vendedor || 'Gustavo Tibério')
      setProjeto(p.projeto || 'Corteplan Concept. AI Rendered.')
      setResponsavel(p.responsavel || 'Gustavo Tibério')
      setIncludeAmbiente(p.include_ambiente !== false)

      if (p.render_imagem) {
        setRenderPreview(getProjectFileUrl(p, p.render_imagem))
      }
      if (p.ambiente_imagem) {
        setAmbientePreview(getProjectFileUrl(p, p.ambiente_imagem))
      }
      if (p.desenho_imagem) {
        setDesenhoPreview(getProjectFileUrl(p, p.desenho_imagem))
      }

      toast({
        title: 'Projeto carregado',
        description: `Os dados do projeto "${p.cliente} - ${p.modelo}" foram preenchidos no formulário.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar projeto',
        description: 'Não foi possível buscar o projeto solicitado.',
      })
    } finally {
      setIsLoadingProject(false)
    }
  }

  // Handlers for image uploads
  const handleRenderSelect = (file: File) => {
    setRenderFile(file)
    const url = URL.createObjectURL(file)
    setRenderPreview(url)
    if (errors.render) {
      setErrors((prev) => ({ ...prev, render: undefined }))
    }
  }

  const handleRenderRemove = () => {
    setRenderFile(null)
    setRenderPreview(null)
  }

  const handleAmbienteSelect = (file: File) => {
    setAmbienteFile(file)
    const url = URL.createObjectURL(file)
    setAmbientePreview(url)
  }

  const handleAmbienteRemove = () => {
    setAmbienteFile(null)
    setAmbientePreview(null)
  }

  const handleDesenhoSelect = (file: File) => {
    setDesenhoFile(file)
    const url = URL.createObjectURL(file)
    setDesenhoPreview(url)
    if (errors.desenho) {
      setErrors((prev) => ({ ...prev, desenho: undefined }))
    }
  }

  const handleDesenhoRemove = () => {
    setDesenhoFile(null)
    setDesenhoPreview(null)
  }

  // Assembled BoardData
  const boardData: BoardData = {
    cliente,
    modelo,
    data,
    vendedor,
    projeto,
    responsavel,
    includeAmbiente,
    renderUrl: renderPreview,
    ambienteUrl: ambientePreview,
    desenhoUrl: desenhoPreview,
  }

  // Validation
  const validateForExport = (): boolean => {
    const newErrors: { render?: string; desenho?: string } = {}

    if (!renderPreview) {
      newErrors.render = 'Imagem obrigatória: Render de estúdio'
    }
    if (!desenhoPreview) {
      newErrors.desenho = 'Imagem obrigatória: Desenho técnico'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Export PDF
  const handleExportPdf = async () => {
    if (!validateForExport()) {
      toast({
        variant: 'destructive',
        title: 'Imagens obrigatórias pendentes',
        description: 'Adicione o Render de estúdio e o Desenho técnico para exportar a prancha.',
      })
      return
    }

    setIsExporting(true)
    setExportProgress('Iniciando processamento em alta resolução...')

    try {
      const pdfBlob = await generatePranchaPdf(boardData, (step, current, total) => {
        setExportProgress(`Etapa ${current}/${total}: ${step}`)
      })

      const safeCliente = cliente ? cliente.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Cliente'
      const safeModelo = modelo ? modelo.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Projeto'
      const filename = `Prancha_Corteplan_${safeCliente}_${safeModelo}.pdf`

      downloadPdf(pdfBlob, filename)

      toast({
        title: 'PDF exportado com sucesso',
        description: `O arquivo "${filename}" foi baixado em alta resolução.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo PDF. Tente novamente.',
      })
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  // Save Project
  const handleSaveProject = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login necessário',
        description: 'Você precisa estar autenticado para salvar projetos.',
      })
      navigate('/login')
      return
    }

    if (!cliente.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Preencha o nome do Cliente para salvar o projeto.',
      })
      return
    }

    setIsSaving(true)
    try {
      const saved = await saveProject(
        {
          id: projectId,
          cliente,
          modelo,
          data,
          vendedor,
          projeto,
          responsavel,
          include_ambiente: includeAmbiente,
          render_file: renderFile,
          ambiente_file: ambienteFile,
          desenho_file: desenhoFile,
        },
        user.id,
      )

      setProjectId(saved.id)
      toast({
        title: 'Projeto salvo com sucesso',
        description: `O projeto "${saved.cliente}" foi registrado no sistema.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar projeto',
        description: 'Não foi possível persistir as informações.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle modal preview click
  const openModal = (
    type: 'cover' | 'render' | 'ambiente' | 'desenho',
    pageNumber: number,
    title: string,
    imageUrl?: string | null,
  ) => {
    setModalPage({
      isOpen: true,
      pageNumber,
      type,
      title,
      imageUrl,
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCDCDC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
              Nova Prancha
            </h1>
            {projectId && (
              <span className="text-xs bg-[#FFF3EC] text-[#F2612A] font-semibold px-2.5 py-0.5 rounded-full border border-[#F2612A]/30">
                Editando projeto salvo
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Preencha os dados e gere a prancha de apresentação diagramada A4 paisagem
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveProject}
            disabled={isSaving || isLoadingProject}
            className="border-[#DCDCDC] text-[#1F1F1F] hover:bg-[#F7F7F5] h-10 px-4 text-xs sm:text-sm font-semibold shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#F2612A]" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 text-[#6B6B6B]" />
                Salvar projeto
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting || isLoadingProject}
            className="bg-[#F2612A] hover:bg-[#D9531F] text-white h-10 px-5 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando PDF…
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress banner when exporting */}
      {isExporting && (
        <div className="p-4 bg-[#FFF3EC] border border-[#F2612A]/30 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-[#F2612A] font-medium animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>{exportProgress || 'Gerando PDF em 300 DPI...'}</span>
        </div>
      )}

      {/* Main Two-Column Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (~380-420px -> 5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCDCDC] p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-[#DCDCDC] pb-3">
            <h2 className="text-base font-bold text-[#1F1F1F] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F2612A]" />
              Dados do Projeto
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Valores impressos no rodapé padrão de todas as páginas técnicas
            </p>
          </div>

          <div className="space-y-4">
            {/* Cliente */}
            <div className="space-y-1">
              <Label htmlFor="cliente" className="text-xs font-semibold text-[#1F1F1F]">
                Cliente <span className="text-[#F2612A]">*</span>
              </Label>
              <Input
                id="cliente"
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nome do cliente (ex: Residência Morumbi)"
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Modelo */}
            <div className="space-y-1">
              <Label htmlFor="modelo" className="text-xs font-semibold text-[#1F1F1F]">
                Modelo <span className="text-[#F2612A]">*</span>
              </Label>
              <Input
                id="modelo"
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Modelo do projeto (ex: Cozinha Gourmet Carvalho)"
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Data */}
            <div className="space-y-1">
              <Label htmlFor="data" className="text-xs font-semibold text-[#1F1F1F]">
                Data <span className="text-[#F2612A]">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Vendedor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="vendedor" className="text-xs font-semibold text-[#1F1F1F]">
                  Vendedor
                </Label>
                <span className="text-[10px] text-[#8E8E8E]">Padrão editável</span>
              </div>
              <Input
                id="vendedor"
                type="text"
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                placeholder="Gustavo Tibério"
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Projeto */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="projeto" className="text-xs font-semibold text-[#1F1F1F]">
                  Projeto
                </Label>
                <span className="text-[10px] text-[#8E8E8E]">Padrão editável</span>
              </div>
              <Input
                id="projeto"
                type="text"
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                placeholder="Corteplan Concept. AI Rendered."
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Responsável */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="responsavel" className="text-xs font-semibold text-[#1F1F1F]">
                  Responsável
                </Label>
                <span className="text-[10px] text-[#8E8E8E]">Padrão editável</span>
              </div>
              <Input
                id="responsavel"
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Gustavo Tibério"
                className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
              />
            </div>

            {/* Toggle switch: Incluir página de Aplicação em ambiente */}
            <div className="pt-3 border-t border-[#DCDCDC]">
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#DCDCDC]">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="toggle-ambiente"
                    className="text-xs font-bold text-[#1F1F1F] cursor-pointer"
                  >
                    Incluir página de Aplicação em ambiente
                  </Label>
                  <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                    Desative para omitir a página e reorganizar a numeração automaticamente.
                  </p>
                </div>
                <Switch
                  id="toggle-ambiente"
                  checked={includeAmbiente}
                  onCheckedChange={setIncludeAmbiente}
                  className="data-[state=checked]:bg-[#F2612A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Areas (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCDCDC] p-5 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-[#DCDCDC] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#F2612A]" />
                Imagens das Páginas
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Arquivos gráficos que serão diagramados com recorte centralizado
              </p>
            </div>
            <div className="text-[11px] font-medium text-[#6B6B6B]">
              {includeAmbiente ? '3 imagens suportadas' : '2 imagens suportadas'}
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. Render de estúdio (obrigatório) */}
            <ImageUploadZone
              label="Render de estúdio"
              required
              helperText="Página 01 (Obrigatória)"
              file={renderFile}
              previewUrl={renderPreview}
              error={errors.render}
              onFileSelect={handleRenderSelect}
              onRemove={handleRenderRemove}
            />

            {/* 2. Aplicação em ambiente (opcional, só exibido se toggle ON) */}
            {includeAmbiente && (
              <div className="transition-all animate-fade-in">
                <ImageUploadZone
                  label="Aplicação em ambiente"
                  helperText="Página 02 (Opcional)"
                  file={ambienteFile}
                  previewUrl={ambientePreview}
                  onFileSelect={handleAmbienteSelect}
                  onRemove={handleAmbienteRemove}
                />
              </div>
            )}

            {/* 3. Desenho técnico (obrigatório) */}
            <ImageUploadZone
              label="Desenho técnico"
              required
              helperText={includeAmbiente ? 'Página 03 (Obrigatória)' : 'Página 02 (Obrigatória)'}
              file={desenhoFile}
              previewUrl={desenhoPreview}
              error={errors.desenho}
              onFileSelect={handleDesenhoSelect}
              onRemove={handleDesenhoRemove}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: Pré-visualização das Páginas em Tempo Real */}
      <div className="bg-white rounded-2xl border border-[#DCDCDC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCDCDC] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1F1F1F]">Pré-visualização das páginas</h2>
            <p className="text-xs text-[#6B6B6B]">
              Miniaturas atualizadas em tempo real. Clique em uma página para ampliar.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#F2612A] bg-[#FFF3EC] px-3 py-1 rounded-full w-fit">
            Total: {includeAmbiente ? '4 páginas' : '3 páginas'} (A4 Paisagem)
          </div>
        </div>

        {/* Responsive Grid of Thumbnails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Page 1: Capa (sem número no rodapé) */}
          <PageThumbnail
            pageNumber={0}
            type="cover"
            title="Capa"
            data={boardData}
            onClick={() => openModal('cover', 0, 'Capa')}
          />

          {/* Page 2: Render de estúdio (Página 01) */}
          <PageThumbnail
            pageNumber={1}
            type="render"
            title="Render de Estúdio"
            data={boardData}
            imageUrl={renderPreview}
            onClick={() => openModal('render', 1, 'Render de Estúdio', renderPreview)}
          />

          {/* Page 3: Ambiente (se ativo -> Página 02) */}
          {includeAmbiente && (
            <PageThumbnail
              pageNumber={2}
              type="ambiente"
              title="Aplicação em Ambiente"
              data={boardData}
              imageUrl={ambientePreview}
              onClick={() => openModal('ambiente', 2, 'Aplicação em Ambiente', ambientePreview)}
            />
          )}

          {/* Final Page: Desenho técnico (Página 03 se ambiente ativo, Página 02 se desativada) */}
          <PageThumbnail
            pageNumber={includeAmbiente ? 3 : 2}
            type="desenho"
            title="Desenho Técnico"
            data={boardData}
            imageUrl={desenhoPreview}
            onClick={() =>
              openModal('desenho', includeAmbiente ? 3 : 2, 'Desenho Técnico', desenhoPreview)
            }
          />
        </div>

        {/* Action Buttons below preview */}
        <div className="pt-6 border-t border-[#DCDCDC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-600" />
            <span>Documento em conformidade com o padrão visual Corteplan Móveis Especiais.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveProject}
              disabled={isSaving || isLoadingProject}
              className="flex-1 sm:flex-initial border-[#DCDCDC] h-11 px-5 text-sm font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#F2612A]" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 text-[#6B6B6B]" />
                  Salvar projeto
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || isLoadingProject}
              className="flex-1 sm:flex-initial bg-[#F2612A] hover:bg-[#D9531F] text-white h-11 px-6 text-sm font-bold shadow-xs active:scale-[0.98]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PDF…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal preview */}
      <PagePreviewModal
        isOpen={modalPage.isOpen}
        onClose={() => setModalPage((prev) => ({ ...prev, isOpen: false }))}
        pageNumber={modalPage.pageNumber}
        type={modalPage.type}
        title={modalPage.title}
        data={boardData}
        imageUrl={modalPage.imageUrl}
      />
    </div>
  )
}
