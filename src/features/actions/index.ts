/**
 * Action Workflows Feature Barrel.
 * brain.md §7 P6
 */

export { ActionsPanel, type ActionsPanelProps, type ActionTab } from "./components/ActionsPanel";
export { ChecklistTab, type ChecklistTabProps } from "./components/ChecklistTab";
export { LawyerBriefView, type LawyerBriefViewProps } from "./components/LawyerBriefView";
export { OptionsTab, type OptionsTabProps } from "./components/OptionsTab";
export { NegotiateTab, type NegotiateTabProps } from "./components/NegotiateTab";
export { useActions, type UseActionsOptions, type UseActionsReturn } from "./hooks/use-actions";
export {
  parseDueDateToDateArray,
  buildChecklistICS,
  triggerICSDownload,
} from "./exporters/ics-export";
