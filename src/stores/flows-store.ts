import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FlowTemplate, FlowStage, FormTemplate, ClientFlow, ClientStageProgress, FlowStatus, FormSubmission, StageStatus } from '@/types/onboarding'
import {
  mockFlowTemplates,
  mockFlowStages,
  mockFormTemplates,
  mockClientFlows,
  mockClientStageProgress,
} from '@/data/mock-flows'

interface FlowsState {
  flowTemplates: FlowTemplate[]
  flowStages: FlowStage[]
  formTemplates: FormTemplate[]
  clientFlows: ClientFlow[]
  clientStageProgress: ClientStageProgress[]
  formSubmissions: FormSubmission[]

  // Flow template actions
  addFlowTemplate: (template: FlowTemplate) => void
  updateFlowTemplate: (id: string, updates: Partial<FlowTemplate>) => void
  deleteFlowTemplate: (id: string) => void

  // Stage actions
  addStage: (stage: FlowStage) => void
  updateStage: (id: string, updates: Partial<FlowStage>) => void
  deleteStage: (id: string) => void
  reorderStages: (flowId: string, stageIds: string[]) => void

  // Form template actions
  addFormTemplate: (template: FormTemplate) => void
  updateFormTemplate: (id: string, updates: Partial<FormTemplate>) => void
  deleteFormTemplate: (id: string) => void

  // Client flow actions
  assignFlowToClient: (clientFlow: ClientFlow) => void
  updateClientFlowStatus: (clientFlowId: string, status: FlowStatus) => void

  // Stage progress actions
  updateStageProgress: (clientFlowId: string, stageId: string, status: StageStatus) => void

  // Form submission actions
  saveFormSubmission: (submission: FormSubmission) => void
}

export const useFlowsStore = create<FlowsState>()(
  persist(
    (set) => ({
      flowTemplates: mockFlowTemplates,
      flowStages: mockFlowStages,
      formTemplates: mockFormTemplates,
      clientFlows: mockClientFlows,
      clientStageProgress: mockClientStageProgress,
      formSubmissions: [],

      addFlowTemplate: (template) =>
        set((state) => ({
          flowTemplates: [...state.flowTemplates, template],
        })),

      updateFlowTemplate: (id, updates) =>
        set((state) => ({
          flowTemplates: state.flowTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteFlowTemplate: (id) =>
        set((state) => ({
          flowTemplates: state.flowTemplates.filter((t) => t.id !== id),
        })),

      addStage: (stage) =>
        set((state) => ({
          flowStages: [...state.flowStages, stage],
        })),

      updateStage: (id, updates) =>
        set((state) => ({
          flowStages: state.flowStages.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteStage: (id) =>
        set((state) => ({
          flowStages: state.flowStages.filter((s) => s.id !== id),
        })),

      reorderStages: (flowId, stageIds) =>
        set((state) => ({
          flowStages: state.flowStages.map((s) => {
            if (s.flowTemplateId !== flowId) return s
            const newIndex = stageIds.indexOf(s.id)
            return newIndex !== -1 ? { ...s, orderIndex: newIndex } : s
          }),
        })),

      addFormTemplate: (template) =>
        set((state) => ({
          formTemplates: [...state.formTemplates, template],
        })),

      updateFormTemplate: (id, updates) =>
        set((state) => ({
          formTemplates: state.formTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteFormTemplate: (id) =>
        set((state) => ({
          formTemplates: state.formTemplates.filter((t) => t.id !== id),
        })),

      assignFlowToClient: (clientFlow) =>
        set((state) => ({
          clientFlows: [...state.clientFlows, clientFlow],
        })),

      updateClientFlowStatus: (clientFlowId, status) =>
        set((state) => ({
          clientFlows: state.clientFlows.map((cf) =>
            cf.id === clientFlowId
              ? {
                  ...cf,
                  status,
                  ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
                  ...(status === 'in_progress' && !cf.startedAt ? { startedAt: new Date().toISOString() } : {}),
                }
              : cf
          ),
        })),

      updateStageProgress: (clientFlowId, stageId, status) =>
        set((state) => {
          const exists = state.clientStageProgress.find(
            (p) => p.clientFlowId === clientFlowId && p.stageId === stageId
          )
          if (exists) {
            return {
              clientStageProgress: state.clientStageProgress.map((p) =>
                p.clientFlowId === clientFlowId && p.stageId === stageId
                  ? { ...p, status, ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}) }
                  : p
              ),
            }
          }
          return {
            clientStageProgress: [
              ...state.clientStageProgress,
              {
                id: `progress-${Date.now()}`,
                clientFlowId,
                stageId,
                status,
                ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
              },
            ],
          }
        }),

      saveFormSubmission: (submission) =>
        set((state) => {
          const idx = state.formSubmissions.findIndex(
            (s) =>
              s.clientFlowId === submission.clientFlowId &&
              s.formTemplateId === submission.formTemplateId &&
              s.stageId === submission.stageId
          )
          if (idx !== -1) {
            const updated = [...state.formSubmissions]
            updated[idx] = { ...submission, updatedAt: new Date().toISOString() }
            return { formSubmissions: updated }
          }
          return { formSubmissions: [...state.formSubmissions, submission] }
        }),

    }),
    {
      name: 'exim-flows',
    }
  )
)
