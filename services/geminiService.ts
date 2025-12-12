
import { GoogleGenAI, Type } from "@google/genai";
import { SystemArchitecture, NodeType, ChatMessage, TutorialStep, ProjectDetails, ArchitectureScore, GameScenario, GameValidation } from "../types";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';

// Initialize client
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("API Key is missing in process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey: key || '' });
};

/**
 * Helper: Detects nodes that have 0 connections (Isolated).
 */
const findIsolatedComponents = (arch: SystemArchitecture): string[] => {
  const connectedNodeIds = new Set<string>();
  
  arch.edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const isolatedNodes = arch.nodes
    .filter(node => !connectedNodeIds.has(node.id))
    .map(node => `"${node.label}" (ID: ${node.id})`);

  return isolatedNodes;
};

/**
 * Generates a system architecture based on structured project details.
 */
export const generateArchitecture = async (details: ProjectDetails, lang: 'en' | 'tr' = 'en'): Promise<SystemArchitecture> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  
  const langInstruction = lang === 'tr' 
    ? "CRITICAL INSTRUCTION: Perform all architectural reasoning in English. However, the final JSON output fields (title, description, node labels) MUST be in TURKISH." 
    : "Provide response in English.";

  // Determine complexity.
  // We bias towards COMPLEXITY unless it's explicitly a tiny tool.
  const isSimpleExplicit = details.domain.includes('Basic') || details.scale.includes('Prototype');
  
  let complexityInstruction = "";
  if (isSimpleExplicit) {
      complexityInstruction = "Simplicity Rule: Keep it moderate (5-8 nodes).";
  } else {
      complexityInstruction = `
      MAXIMALIST DESIGN RULE: 
      - The user wants an IMPRESSIVE, DETAILED architecture. 
      - Do NOT summarize. Split components. 
      - Instead of 'Clients', generate 'Web App', 'iOS App', 'Android App', 'Admin Portal'.
      - Instead of 'Backend', generate 'Auth Service', 'Core API', 'Worker Service'.
      - Include 'Load Balancer', 'CDN', 'Redis', 'Database'.
      `;
  }

  const systemPrompt = `
    You are a Distinguished Software Architect.
    Your goal is to design a detailed system architecture JSON.

    ${complexityInstruction}

    **ARCHITECTURAL RULES:**
    1. **Layer Isolation:** Clients -> Entry Points (CDN/LB/Gateway) -> Services -> Data.
    2. **Granularity:** Prefer more nodes over fewer nodes. Detailed is better.
    3. **Context:**
       - If IoT: Sensors -> Gateway -> Broker -> Processing.
       - If Streaming: Clients -> CDN -> API -> Transcoding Workers -> Storage.

    **Project Context:**
    - Name: ${details.name}
    - Domain: ${details.domain}
    - Target Scale: ${details.scale}
    - Key Priorities: ${details.priorities.join(', ')}

    ${langInstruction}
    
    Return strict JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `${systemPrompt}\n\nUser Description: ${details.description}`,
    config: {
      thinkingConfig: {
        thinkingBudget: 2048,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(NodeType) },
                description: { type: Type.STRING },
                technologies: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Suggested technologies"
                }
              },
              required: ["id", "label", "type", "description"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["id", "source", "target"]
            }
          }
        },
        required: ["nodes", "edges", "title", "description"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as SystemArchitecture;
};

export const scoreArchitecture = async (arch: SystemArchitecture, details: ProjectDetails, lang: 'en' | 'tr' = 'en'): Promise<ArchitectureScore> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  const langInstruction = lang === 'tr' ? "Output summary in Turkish." : "Output summary in English.";

  const prompt = `
    Act as an independent Auditor. Evaluate the provided system architecture against the project requirements.
    
    Project Requirements: ${JSON.stringify(details)}
    Architecture Design: ${JSON.stringify(arch)}
    
    Provide a score from 0-100 for each category based on industry standards.
    - Scalability: Can it handle the requested load?
    - Availability: Is it resilient to failures?
    - Complexity: Is it over-engineered? (Higher score = Better/Simpler/Balanced).
    - CostEfficiency: Is it cost-effective?
    - Security: Are there obvious security gaps?

    ${langInstruction}
    Return strict JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scalability: { type: Type.NUMBER },
          availability: { type: Type.NUMBER },
          complexity: { type: Type.NUMBER },
          costEfficiency: { type: Type.NUMBER },
          security: { type: Type.NUMBER },
          summary: { type: Type.STRING }
        },
        required: ["scalability", "availability", "complexity", "costEfficiency", "security", "summary"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text) as ArchitectureScore;
};

export const critiqueArchitecture = async (arch: SystemArchitecture, lang: 'en' | 'tr' = 'en'): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-pro-preview";
  
  const isolatedNodes = findIsolatedComponents(arch);
  let brokenChainContext = "";
  
  if (isolatedNodes.length > 0) {
      brokenChainContext = `
      CRITICAL WARNING - BROKEN CHAINS DETECTED: 
      The following nodes have NO connections (edges) and are completely isolated:
      ${JSON.stringify(isolatedNodes)}
      `;
  }

  const langInstruction = lang === 'tr' 
    ? "Perform the analysis in English. Write the FINAL OUTPUT report in TURKISH." 
    : "Output in English.";

  const context = JSON.stringify(arch, null, 2);
  const prompt = `
    Analyze the following software system architecture JSON.
    ${brokenChainContext}
    Analysis Goals:
    1. Identify broken chains.
    2. Identify SPOFs.
    3. Suggest Scalability improvements (Caching, Queues, Sharding).
    4. Identify Security risks (WAF, Private Subnets).
    
    Be extremely technical.
    ${langInstruction}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `System Context: ${context}\n\nTask: ${prompt}`,
    config: {
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 2048, 
      }
    }
  });

  return response.text || "Analysis failed.";
};

/**
 * Generates an IMPROVED version of the architecture based on the critique.
 */
export const improveArchitecture = async (currentArch: SystemArchitecture, critique: string, lang: 'en' | 'tr' = 'en'): Promise<SystemArchitecture> => {
  const ai = getAiClient();
  const model = "gemini-3-pro-preview";
  
  const isolatedNodes = findIsolatedComponents(currentArch);
  
  let mandatoryFixInstruction = "";
  if (isolatedNodes.length > 0) {
      mandatoryFixInstruction = `
      🚨 **MANDATORY FIX REQUIRED - ORPHAN NODES**: 
      Connect these nodes: ${isolatedNodes.join(', ')}.
      `;
  }

  const langInstruction = lang === 'tr' 
    ? "Think in English, but the JSON labels/titles MUST be in TURKISH." 
    : "Output in English.";

  const prompt = `
    You are the **Chief Architect at a FAANG company** (Facebook, Amazon, Netflix, Google).
    
    **TASK:**
    Transform the current architecture into a **Hyper-Scale, Distributed, Enterprise-Grade System**.
    We are not building a toy app. We are building a global platform.
    
    **AGGRESSIVE SCALABILITY RULES (DO NOT SIMPLIFY):**
    1.  **Decompose Everything:** Never use a single 'Backend' node. Split it into domain-specific Microservices:
        -   Auth Service, User Service, Payment Service, Notification Service, Search Service, Analytics Service, Inventory/Content Service.
    2.  **Infrastructure Complexity:**
        -   Entry: CDN -> WAF -> Load Balancer -> API Gateway (GraphQL Federation).
        -   Clients: Separate Web, iOS, Android, Admin Panel, 3rd Party API clients.
    3.  **Data Layer Granularity:**
        -   Do not use just "Database". Use: 'Primary DB (Write)', 'Read Replicas', 'Redis Cluster (Cache)', 'Elasticsearch (Search)', 'Data Lake (Analytics)'.
    4.  **Asynchronous by Default:**
        -   Use 'Kafka' or 'RabbitMQ' for inter-service communication.
        -   Use 'Worker Nodes' for background processing (Video encoding, Email sending, Report generation).
    5.  **Target Size:** The final architecture should have **20-30+ nodes** if the domain supports it. Make it look professional and dense.
    
    **MANDATORY FIXES:**
    ${mandatoryFixInstruction}
    - Fix SPOFs.
    - Ensure logical flow.

    ${langInstruction}
    
    Return strict JSON matching the SystemArchitecture schema.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 4096, 
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(NodeType) },
                description: { type: Type.STRING },
                technologies: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
                }
              },
              required: ["id", "label", "type", "description"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["id", "source", "target"]
            }
          }
        },
        required: ["nodes", "edges", "title", "description"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate improved architecture");
  return JSON.parse(text) as SystemArchitecture;
};

/**
 * Chat with Architect
 */
export const chatWithArchitect = async (
    history: ChatMessage[], 
    currentMessage: string, 
    lang: 'en' | 'tr' = 'en', 
    contextArch?: SystemArchitecture,
    contextCritique?: string,
    contextScore?: ArchitectureScore,
    persona: 'architect' | 'tutor' = 'architect',
    modelName: string = 'gemini-3-pro-preview'
): Promise<{ message: string, updatedArchitecture?: SystemArchitecture, highlightNodeIds?: string[], highlightLayer?: string }> => {
  const ai = getAiClient();
  
  const langInstruction = lang === 'tr' 
    ? "Think in English, reply in TURKISH." 
    : "Reply in English.";

  let archContextString = "";
  if (contextArch) {
    archContextString = `
    **CURRENT SYSTEM ARCHITECTURE (JSON):**
    ${JSON.stringify(contextArch)}
    
    **INSTRUCTIONS FOR MODIFICATION:**
    If the user asks to modify the system (e.g., "Add a Redis cache", "Remove the SQL DB", "Connect mobile to queue"):
    1. You MUST return the \`updatedArchitecture\` field in the JSON response.
    2. The \`updatedArchitecture\` must be the COMPLETE JSON of the new state (nodes + edges).
    3. Keep existing IDs for unchanged nodes. Generate new IDs for new nodes.
    4. Ensure valid connections.
    `;
  }

  let reviewContextString = "";
  if (contextScore || contextCritique) {
      reviewContextString = `
      [BENCHMARK SCORES]: ${contextScore ? JSON.stringify(contextScore) : 'Not available'}
      [DEEP CRITIQUE]: ${contextCritique ? contextCritique.substring(0, 2000) + '...' : 'Not available'}
      `;
  }

  let personaPrompt = "";
  if (persona === 'tutor') {
      personaPrompt = `
      **PERSONA: THE GAME TUTOR (MENTOR)**
      You are a friendly, patient, and educational Computer Science Mentor.
      The user is currently playing a "System Design Challenge".
      Goals: Help the user solve the puzzle. Use Socratic method. Explain concepts simply.
      `;
  } else {
      personaPrompt = `
      **PERSONA: THE SENIOR PRINCIPAL ARCHITECT**
      You are 'Archi', a world-class Senior Software Architect. 
      Be highly technical, professional, and detailed.
      `;
  }

  const prompt = `
    ${personaPrompt}
    ${archContextString}
    ${reviewContextString}
    User: ${currentMessage}
    ${langInstruction}
    Return JSON matching the schema.
  `;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.OBJECT,
        properties: {
            message: { type: Type.STRING },
            highlightNodeIds: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            highlightLayer: { type: Type.STRING, nullable: true },
            updatedArchitecture: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING, enum: Object.values(NodeType) }, description: { type: Type.STRING }, technologies: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["id", "label", "type", "description"] } },
                    edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING } }, required: ["id", "source", "target"] } }
                },
                required: ["nodes", "edges", "title", "description"]
            }
        },
        required: ["message"]
    }
  };

  if (modelName.includes('pro')) {
      config.thinkingConfig = { thinkingBudget: 8192 };
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text) as { message: string, updatedArchitecture?: SystemArchitecture, highlightNodeIds?: string[], highlightLayer?: string };
};

export const analyzeDiagramImage = async (base64Data: string, mimeType: string, lang: 'en' | 'tr' = 'en'): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-pro-preview";
  const prompt = lang === 'tr' ? "Analyze this diagram. Think in English, provide response in Turkish." : "Analyze this diagram.";
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: prompt }] }
  });
  return response.text || "";
};

export const analyzeImage = async (base64: string, mimeType: string, prompt: string, lang: 'en' | 'tr'): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-3-pro-preview';
    const langInstruction = lang === 'tr' ? "Answer in Turkish." : "Answer in English.";
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `${prompt} ${langInstruction}` }] }
    });
    return response.text || "Analysis failed";
}

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) { await (window as any).aistudio.openSelectKey(); }
  }
  const freshClient = getAiClient();
  const response = await freshClient.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { imageSize: size, aspectRatio: "1:1" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const getTechRecommendations = async (query: string, lang: 'en' | 'tr' = 'en'): Promise<{ text: string, sources: any[] }> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  const langInstruction = lang === 'tr' ? "Summarize in Turkish." : "in English";
  const response = await ai.models.generateContent({
    model,
    contents: `Tech stack recommendations for: ${query}. 2024-2025 trends. ${langInstruction}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const generateSystemTutorial = async (arch: SystemArchitecture, lang: 'en' | 'tr' = 'en'): Promise<TutorialStep[]> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  const langInstruction = lang === 'tr' ? "Output message in Turkish." : "Output message in English.";
  const prompt = `
    Analyze this system architecture.
    Create a tutorial that explains the flow of data through the system, step by step.
    For each step, identify which Node ID or Edge ID is active.
    Architecture: ${JSON.stringify(arch)}
    ${langInstruction}
    Return JSON array.
  `;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { stepNumber: { type: Type.NUMBER }, message: { type: Type.STRING }, targetNodeId: { type: Type.STRING, nullable: true }, targetEdgeId: { type: Type.STRING, nullable: true } },
          required: ["stepNumber", "message"]
        }
      }
    }
  });
  const text = response.text;
  if (!text) throw new Error("No tutorial generated");
  return JSON.parse(text) as TutorialStep[];
};

export const generateGameChallenge = async (level: number, domain: string, lang: 'en' | 'tr' = 'en', mode: 'Tutorial' | 'Challenge' = 'Challenge'): Promise<GameScenario> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  const langInstruction = lang === 'tr' ? "Output title, description, hint in Turkish." : "Output in English.";
  
  let levelContext = "";
  
  if (mode === 'Tutorial') {
      const subjects = [
          "Basics: Client & Server", 
          "Basics: Adding a Database", 
          "Performance: Caching Layer", 
          "Scale: Load Balancing", 
          "Advanced: Microservices"
      ];
      const subject = subjects[Math.min(level - 1, 4)];
      levelContext = `
      **MODE: TUTORIAL (LEARNING)**
      **LEVEL: ${level} - ${subject}**
      Domain: ${domain}
      Create a simplified, educational architecture scenario.
      The architecture SHOULD be slightly incomplete or just a starting point for the user to understand this concept.
      The description should act as a lesson introduction.
      The 'hint' should be a direct instruction on what to observe or add.
      `;
  } else {
      const concepts = [
          "Security Risk (Direct Access)", 
          "Single Point of Failure", 
          "High Latency / Bottleneck", 
          "Data Loss Risk", 
          "Scalability Limits"
      ];
      const concept = concepts[Math.min(level - 1, 4)];
      levelContext = `
      **MODE: CHALLENGE (FIX IT)**
      **LEVEL: ${level}**
      **FOCUS PROBLEM:** ${concept}
      Domain: ${domain}
      Create a realistic BROKEN architecture. It must have a critical flaw.
      The description should describe the symptoms (e.g. "System is slow", "Hacked").
      The 'hint' should be vague.
      `;
  }

  const prompt = `
    Create a 'System Architecture Scenario' for the App.
    ${levelContext}
    
    1. Design a system architecture JSON.
    2. Ensure the complexity matches the Level (1 = Simple, 5 = Complex).
    
    ${langInstruction}
    
    Return strict JSON matching the GameScenario interface.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ['Junior', 'Mid-Level', 'Senior', 'Tutorial'] },
          domain: { type: Type.STRING },
          hint: { type: Type.STRING },
          architecture: {
             type: Type.OBJECT,
             properties: {
                 title: { type: Type.STRING },
                 description: { type: Type.STRING },
                 nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING, enum: Object.values(NodeType) }, description: { type: Type.STRING }, technologies: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["id", "label", "type", "description"] } },
                 edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING } }, required: ["id", "source", "target"] } }
             },
             required: ["nodes", "edges", "title", "description"]
          }
        },
        required: ["id", "title", "description", "architecture", "difficulty", "hint"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate challenge");
  return JSON.parse(text) as GameScenario;
};

export const validateGameSolution = async (scenario: GameScenario, userArch: SystemArchitecture, lang: 'en' | 'tr' = 'en'): Promise<GameValidation> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash"; 
  const langInstruction = lang === 'tr' ? "Output feedback in Turkish." : "Output feedback in English.";
  
  const prompt = `
    Evaluate solution.
    Original Problem: ${scenario.title} - ${scenario.description}
    Original Arch: ${JSON.stringify(scenario.architecture)}
    User Solution: ${JSON.stringify(userArch)}
    Task: Did the user fix the problem or learn the concept?
    ${langInstruction}
    Return strict JSON.
  `;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            success: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            correctNodeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            wrongNodeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctedArchitecture: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING, enum: Object.values(NodeType) }, description: { type: Type.STRING }, technologies: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["id", "label", "type", "description"] } },
                    edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING } }, required: ["id", "source", "target"] } }
                },
                required: ["nodes", "edges", "title", "description"]
            }
            },
            required: ["success", "score", "feedback", "correctedArchitecture"]
        }
        }
    });

    const text = response.text;
    if (!text) throw new Error("Validation failed");
    return JSON.parse(text) as GameValidation;
  } catch (error) {
      console.error("Gemini Validation Error:", error);
      throw new Error("Game validation service unavailable.");
  }
};
