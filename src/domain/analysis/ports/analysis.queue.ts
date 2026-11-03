export const ANALYSIS_QUEUE = Symbol('ANALYSIS_QUEUE');

export interface AnalysisQueue {
  publish(input: { analysisId: string }): Promise<{ jobId: string }>;
}
