
export enum NodeType {
  // Client Side
  CLIENT = 'CLIENT',
  IOT_DEVICE = 'IOT_DEVICE', // New: For IoT scenarios
  MOBILE = 'MOBILE',
  
  // Entry Point
  LOAD_BALANCER = 'LOAD_BALANCER',
  API_GATEWAY = 'API_GATEWAY',
  MQTT_BROKER = 'MQTT_BROKER', // New: For IoT
  CDN = 'CDN',

  // Compute / Logic
  SERVER = 'SERVER',
  MICROSERVICE = 'MICROSERVICE',
  WORKER = 'WORKER',
  FUNCTION = 'FUNCTION', // Serverless
  ML_MODEL = 'ML_MODEL', // New: AI/ML
  SMART_CONTRACT = 'SMART_CONTRACT', // New: Blockchain

  // Data
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  QUEUE = 'QUEUE',
  STORAGE = 'STORAGE',
  LEDGER = 'LEDGER', // New: Blockchain
  VECTOR_DB = 'VECTOR_DB', // New: AI

  // External
  EXTERNAL = 'EXTERNAL'
}

export interface ArchitectureNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  technologies?: string[]; // E.g., "PostgreSQL", "Redis"
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface SystemArchitecture {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  title: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  markdown: string;
  sources?: GroundingSource[];
}

export interface TutorialStep {
  stepNumber: number;
  message: string;
  targetNodeId?: string;
  targetEdgeId?: string;
}

export interface ProjectDetails {
  name: string;
  domain: string; // e.g., 'E-commerce', 'Fintech'
  scale: string; // e.g., '10k users', '10M users'
  priorities: string[]; // e.g., ['High Availability', 'Low Cost']
  description: string;
}

export interface ArchitectureScore {
  scalability: number;
  availability: number;
  complexity: number; // Lower is better usually, or handled as "Manageability"
  costEfficiency: number;
  security: number;
  summary: string;
}

// --- Game Mode Types ---
export interface GameScenario {
  id: string;
  title: string;
  description: string; // The problem (e.g., "Database is crashing under read load")
  architecture: SystemArchitecture; // The broken architecture
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Tutorial';
  domain?: string;
  hint: string;
}

export interface GameValidation {
  success: boolean;
  score: number; // 0-100
  feedback: string;
  correctedArchitecture?: SystemArchitecture; // Optional: AI returns the fixed version
  correctNodeIds?: string[]; // Visual Feedback Green
  wrongNodeIds?: string[];   // Visual Feedback Red
}
