export enum AnalysisStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  logIds: string[];
  type: 'error-level' | 'repeated-message' | 'error-spike' | 'known-pattern';
  reason: string;
  evidence: Record<string, unknown>;
  severity: Severity;
  service: string;
}

export interface Incident {
  id: string;
  service: string;
  anomalyType: Anomaly['type'];
  logIds: string[];
  severity: Severity;
  anomalies: Anomaly[];
}

export interface IncidentSummary {
  category: string;
  summary: string;
  recommendations: string[];
}

export interface IncidentReport {
  incident: Incident;
  summary: IncidentSummary;
}

export interface AnalysisResult {
  anomalies: Anomaly[];
  incidents: IncidentReport[];
  recommendations: string[];
}

export interface AnalysisProps {
  id: string;
  status: AnalysisStatus;
  createdAt: Date;
  completedAt?: Date;
  filters: Record<string, unknown>;
  model?: string;
  summary?: string;
  result?: AnalysisResult;
  errorCode?: string;
  logIds: string[];
}

export class Analysis {
  private constructor(private readonly props: AnalysisProps) {}

  static rehydrate(props: AnalysisProps): Analysis {
    return new Analysis({ ...props });
  }

  static pending(props: Omit<AnalysisProps, 'status' | 'completedAt'>): Analysis {
    return new Analysis({ ...props, status: AnalysisStatus.PENDING });
  }

  static running(props: Omit<AnalysisProps, 'status' | 'completedAt'>): Analysis {
    return new Analysis({ ...props, status: AnalysisStatus.RUNNING });
  }

  static completed(props: Omit<AnalysisProps, 'status' | 'completedAt'>): Analysis {
    return new Analysis({
      ...props,
      status: AnalysisStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  toPrimitives(): AnalysisProps {
    return {
      ...this.props,
      filters: { ...this.props.filters },
      logIds: [...this.props.logIds],
    };
  }
}
