import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getProjects, deleteProject, getProjectFileUrl } from '@/services/projects'
import type { ProjectRecord } from '@/services/projects'
import { formatDisplayDate } from '@/lib/pdf/generator'
import { Button } from '@/components/ui/button'
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
  PlusCircle,
  FolderKanban,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Loader2,
  Layers,
  Image as ImageIcon,
} from 'lucide-react'

export default function Projetos() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const data = await getProjects()
      setProjects(data)
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

  const handleOpenProject = (id: string) => {
    navigate(`/?edit=${id}`)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    setDeletingId(projectToDelete.id)

    try {
      await deleteProject(projectToDelete.id)
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      toast({
        title: 'Projeto excluído',
        description: `O projeto "${projectToDelete.cliente}" foi removido com sucesso.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o projeto.',
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
            Gerencie e recarregue pranchas salvas no seu acervo técnico
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
      {!isLoading && projects.length === 0 && (
        <div className="py-20 bg-white border border-dashed border-[#DCDCDC] rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-14 h-14 bg-[#FFF3EC] text-[#F2612A] rounded-2xl flex items-center justify-center">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-bold text-[#1F1F1F]">Nenhum projeto salvo ainda</h2>
            <p className="text-sm text-[#6B6B6B]">
              Crie uma prancha e salve o projeto para vê-lo aqui e reaproveitar os dados sempre que
              precisar.
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
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
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
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#8E8E8E] space-y-1">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Sem render anexado</span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#1F1F1F] shadow-xs flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#F2612A]" />
                    <span>{project.include_ambiente ? '4 págs' : '3 págs'}</span>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-[#1F1F1F] line-clamp-1">
                      {project.cliente}
                    </h3>
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
                      Abrir
                    </Button>

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

      {/* Confirmation Dialog for Exclusion */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl border border-[#DCDCDC]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
              Excluir projeto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#6B6B6B]">
              Tem certeza que deseja remover o projeto &quot;{projectToDelete?.cliente}&quot;? Esta
              ação não pode ser desfeita e todas as imagens vinculadas serão excluídas.
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
