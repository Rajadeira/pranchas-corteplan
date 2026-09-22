import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getProjects, deleteProject, getProjectFileUrl } from '@/services/projects'
import type { ProjectRecord } from '@/services/projects'
import { formatDisplayDate } from '@/lib/pdf/generator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PlusCircle,
  FolderKanban,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Loader2,
  Layers,
  Image as ImageIcon,
  History,
  RotateCcw,
} from 'lucide-react'

interface ProjectGroup {
  rootId: string
  latest: ProjectRecord
  versions: ProjectRecord[]
}

export default function Projetos() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null)
  const [selectedGroupForVersions, setSelectedGroupForVersions] = useState<ProjectGroup | null>(
    null,
  )

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const data = await getProjects()
      setAllProjects(data)
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao listar projetos',
        description: 'Não foi possível carregar seus projetos salvos.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  // Group projects by lineage (rootId)
  const projectGroups: ProjectGroup[] = useMemo(() => {
    const groupsMap = new Map<string, ProjectRecord[]>()

    // Identify root for each record: either parent_id or its own id
    allProjects.forEach((p) => {
      const rootId = p.parent_id || p.id
      if (!groupsMap.has(rootId)) {
        groupsMap.set(rootId, [])
      }
      groupsMap.get(rootId)!.push(p)
    })

    const result: ProjectGroup[] = []
    groupsMap.forEach((records, rootId) => {
      // Sort versions descending: highest version first, then newest created
      records.sort((a, b) => {
        const vA = Number(a.version) || 1
        const vB = Number(b.version) || 1
        if (vA !== vB) return vB - vA
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      })

      const latest = records[0]
      result.push({
        rootId,
        latest,
        versions: records,
      })
    })

    // Sort groups by latest update/creation
    result.sort((a, b) => {
      const timeA = new Date(a.latest.updated || a.latest.created).getTime()
      const timeB = new Date(b.latest.updated || b.latest.created).getTime()
      return timeB - timeA
    })

    return result
  }, [allProjects])

  const handleOpenProject = (id: string) => {
    navigate(`/?edit=${id}`)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    setDeletingId(projectToDelete.id)

    try {
      await deleteProject(projectToDelete.id)
      setAllProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      // Update selectedGroupForVersions if open
      if (selectedGroupForVersions) {
        const updated = selectedGroupForVersions.versions.filter((p) => p.id !== projectToDelete.id)
        if (updated.length === 0) {
          setSelectedGroupForVersions(null)
        } else {
          setSelectedGroupForVersions({
            ...selectedGroupForVersions,
            latest: updated[0],
            versions: updated,
          })
        }
      }
      toast({
        title: 'Versão excluída',
        description: `O registro foi removido com sucesso.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o registro.',
      })
    } finally {
      setDeletingId(null)
      setProjectToDelete(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCDC]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-[#F2612A]" />
            Meus Projetos
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Gerencie e recarregue pranchas salvas no seu acervo técnico com controle de revisões
          </p>
        </div>

        <Link to="/">
          <Button className="bg-[#F2612A] hover:bg-[#D9531F] text-white font-semibold text-xs sm:text-sm shadow-xs h-10 px-4">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Prancha
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F2612A]" />
          <span className="text-sm text-[#6B6B6B]">Carregando seus projetos...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && projectGroups.length === 0 && (
        <div className="py-20 bg-white border border-dashed border-[#DCDCDC] rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-14 h-14 bg-[#FFF3EC] text-[#F2612A] rounded-2xl flex items-center justify-center">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-bold text-[#1F1F1F]">Nenhum projeto salvo ainda</h2>
            <p className="text-sm text-[#6B6B6B]">
              Crie uma prancha e salve o projeto para vê-lo aqui e acompanhar todas as versões de
              revisão.
            </p>
          </div>
          <Link to="/">
            <Button className="bg-[#F2612A] hover:bg-[#D9531F] text-white font-semibold text-sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Primeira Prancha
            </Button>
          </Link>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && projectGroups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectGroups.map((group) => {
            const project = group.latest
            const versionNum = project.version || 1
            const versionBadge = `v${versionNum}`
            const fullTitle = `${project.cliente} — ${versionBadge}`
            const hasMultipleVersions = group.versions.length > 1

            const thumbnailUrl = project.render_imagem
              ? getProjectFileUrl(project, project.render_imagem, '400x300')
              : null

            return (
              <div
                key={project.id}
                className="bg-white border border-[#DCDCDC] rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-[#F2612A]/50 transition-all duration-200"
              >
                {/* Image Banner */}
                <div className="relative w-full aspect-[16/10] bg-[#F7F7F5] border-b border-[#DCDCDC] overflow-hidden flex items-center justify-center group">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={project.cliente}
                      className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-102"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#8E8E8E] space-y-1">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Sem render anexado</span>
                    </div>
                  )}

                  {/* Badges on top of image */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge className="bg-[#F2612A] hover:bg-[#F2612A] text-white font-bold text-xs px-2.5 py-0.5 shadow-xs">
                      {versionBadge}
                    </Badge>
                    {hasMultipleVersions && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGroupForVersions(group)
                        }}
                        className="bg-white/95 hover:bg-white text-[#1F1F1F] hover:text-[#F2612A] text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-[#DCDCDC] transition-colors"
                        title="Ver histórico de versões"
                      >
                        <History className="w-3 h-3 text-[#F2612A]" />
                        <span>{group.versions.length} versões</span>
                      </button>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#1F1F1F] shadow-xs flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#F2612A]" />
                    <span>{project.include_ambiente ? '4 págs' : '3 págs'}</span>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-bold text-base text-[#1F1F1F] line-clamp-1"
                        title={fullTitle}
                      >
                        {fullTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-[#6B6B6B] line-clamp-1 font-medium">
                      {project.modelo || 'Sem modelo especificado'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B6B6B] pt-2 border-t border-[#F0F0EE]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8E8E8E]" />
                      <span className="truncate">{formatDisplayDate(project.data) || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8E8E8E]" />
                      <span className="truncate">{project.vendedor || 'Corteplan'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#DCDCDC] flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProject(project.id)}
                      className="flex-1 border-[#DCDCDC] hover:bg-[#FFF3EC] hover:text-[#F2612A] text-xs font-semibold h-9"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Abrir ({versionBadge})
                    </Button>

                    {hasMultipleVersions && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGroupForVersions(group)}
                        className="h-9 px-2.5 text-xs border-[#DCDCDC] text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F7F7F5]"
                        title="Ver histórico de revisões"
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === project.id}
                      onClick={() => setProjectToDelete(project)}
                      className="h-9 px-3 text-xs text-[#6B6B6B] hover:text-red-600 hover:bg-red-50"
                      title="Excluir projeto"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog for Versions History */}
      <Dialog
        open={!!selectedGroupForVersions}
        onOpenChange={(open) => !open && setSelectedGroupForVersions(null)}
      >
        <DialogContent className="max-w-2xl bg-white rounded-2xl border border-[#DCDCDC] p-6">
          <DialogHeader className="pb-3 border-b border-[#DCDCDC]">
            <DialogTitle className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
              <History className="w-5 h-5 text-[#F2612A]" />
              <span>Histórico de Revisões — {selectedGroupForVersions?.latest.cliente}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6B6B]">
              Acompanhe todas as versões desta prancha. Você pode abrir qualquer versão anterior
              para visualização, edição ou restauração.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-[#EBEBEB] max-h-[60vh] overflow-y-auto pr-1">
            {selectedGroupForVersions?.versions.map((ver, idx) => {
              const isCurrent = idx === 0
              const vNum = ver.version || 1
              const verThumb = ver.render_imagem
                ? getProjectFileUrl(ver, ver.render_imagem, '120x90')
                : null

              return (
                <div
                  key={ver.id}
                  className={`py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isCurrent ? 'bg-[#FFF9F5] -mx-2 px-2 rounded-xl' : 'hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-10 rounded-md border border-[#DCDCDC] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      {verThumb ? (
                        <img
                          src={verThumb}
                          alt={ver.cliente}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#8E8E8E]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1F1F1F]">
                          {ver.cliente} — v{vNum}
                        </span>
                        {isCurrent && (
                          <Badge className="bg-[#F2612A] text-white text-[10px] px-2 py-0">
                            Versão Atual
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#6B6B6B] flex items-center gap-3">
                        <span>Modelo: {ver.modelo || '-'}</span>
                        <span>•</span>
                        <span>Data: {formatDisplayDate(ver.data) || '-'}</span>
                        <span>•</span>
                        <span>Salvo em {new Date(ver.created).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {ver.version_notes && (
                        <p className="text-[11px] text-[#8E8E8E] italic line-clamp-1">
                          Nota: {ver.version_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedGroupForVersions(null)
                        handleOpenProject(ver.id)
                      }}
                      className={
                        isCurrent
                          ? 'bg-[#F2612A] hover:bg-[#D9531F] text-white text-xs h-8 px-3 font-semibold'
                          : 'border-[#DCDCDC] hover:bg-[#FFF3EC] hover:text-[#F2612A] text-xs h-8 px-3 font-semibold'
                      }
                      variant={isCurrent ? 'default' : 'outline'}
                    >
                      {isCurrent ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Abrir Atual
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Abrir v{vNum}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectToDelete(ver)}
                      className="h-8 px-2 text-xs text-[#6B6B6B] hover:text-red-600 hover:bg-red-50"
                      title="Excluir esta versão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Exclusion */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl border border-[#DCDCDC]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
              Excluir versão do projeto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#6B6B6B]">
              Tem certeza que deseja remover {projectToDelete?.cliente} — v
              {projectToDelete?.version || 1}? Esta ação não pode ser desfeita e todas as imagens
              vinculadas a esta versão serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#DCDCDC] text-xs font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
