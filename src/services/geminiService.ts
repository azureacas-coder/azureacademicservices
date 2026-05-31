import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BMToolDetail {
  name: string;
  explanation: string;
}

export interface BMIAProposal {
  companyName: string;
  companyDescription: string;
  issueToEvaluate: string;
  direction: string; // "Forward Looking" or "Backward Looking" + Explanation
  evaluationReason: string;
  conceptInvolved: string; // Concept name + Explanation
  conclusionsInferences: string;
  bmTools: BMToolDetail[];
  secondaryDataSuggestions: string;
}

export interface MathIAProposal {
  title: string;
  researchQuestion: string;
  suitableCourse: string; // Mathematics: Analysis and Approaches (AA) or Mathematics: Applications and Interpretation (AI)
  level: string; // SL, HL, or SL and HL
  mathematicalArea: string; // calculus, statistics, probability, etc.
  mathematicalTools: string;
  realWorldContext: string;
  dataNeeded: string;
  possibleTechnology: string;
  whyStrongTopic: string;
  possiblePersonalEngagement: string;
  possibleLimitations: string;
  difficultyLevel: string;
}

export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  relevance: string;
  tags: string[];
  trendingScore: number;
  proposal?: BMIAProposal;
  mathProposal?: MathIAProposal;
}

export enum GenerationMode {
  GENERAL = "general",
  BM_IA = "bm_ia",
  MATH_IA = "math_ia"
}

export interface Suggestion {
  text: string;
  citationPotential: number;
}

export const getAutocompleteSuggestions = async (
  input: string,
  mode: GenerationMode = GenerationMode.GENERAL
): Promise<Suggestion[]> => {
  if (!input.trim() || input.length < 2) return [];

  const contextText = mode === GenerationMode.BM_IA 
    ? "Business Management academic research" 
    : mode === GenerationMode.MATH_IA 
      ? "IB Mathematics IA modeling and analysis (such as calculus, statistics, probability, modelling)" 
      : "general cutting-edge research";

  const prompt = `Based on the partial input "${input}" in the context of ${contextText}, 
  provide 5 specific autocomplete suggestions for research fields or topics.
  For each, estimate a "Citation Potential" percentage (0-100%) based on how trending/novel the area is in late 2024 through 2026.
  Return a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a research librarian and bibliometrics expert. You predict which topics will get the most citations based on current academic momentum. Return strictly valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              citationPotential: { type: Type.NUMBER }
            },
            required: ["text", "citationPotential"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Autocomplete Error:", error);
    return [];
  }
};

export const generateTopics = async (
  keyword: string,
  history: string[] = [],
  mode: GenerationMode = GenerationMode.GENERAL,
  mathFilters?: {
    interestArea: string;
    course: string;
    level: string;
    mathArea: string;
    dataType: string;
    country: string;
    difficulty: string;
    count?: number;
  }
): Promise<ResearchTopic[]> => {
  let prompt = "";
  let systemInstruction = "";

  if (mode === GenerationMode.BM_IA) {
    systemInstruction = `You are an expert IB Business Management (BM) Internal Assessment (IA) and Extended Essay (EE) advisor. 
    Your goal is to formulate highly professional, academic, student-friendly, and specific research topics and proposal outlines.

    RESEARCH QUESTION CONSTRAINTS:
    - Every research question (Title) MUST:
      * Start with “To what extent”
      * Mention the company name
      * Mention the specific strategy, issue, or decision (taken/implemented after 2024)
      * Mention the dependent business outcome (e.g., market share, brand image, profitability, customer loyalty, revenue, employee productivity, or competitive advantage)
      * Mention the country or market
      * Be specific, not too broad, and DO NOT directly include the year (no "after 2024" or "in 2026") to remain refined and presentable.
    
    PROPOSAL SECTIONS RULES:
    1. Name of company: Write the official real company name.
    2. Brief description of the company: Short background, its industry, operations, and why it is relevant for analysis.
    3. The issue you would like to evaluate: Explain the specific issue/initiative connected to performance (e.g., brand image, customer loyalty).
    4. Is it forward looking or backward looking: Choose either "Forward Looking" or "Backward Looking" and explain why.
    5. Why evaluate this: Explain relevance, importance, industry trends, competition, stakeholders, and business impact.
    6. Concept involved: Choose ONLY one main concept from: Creativity, Ethics, Sustainability, Change. Explain why it fits the issue.
    7. Conclusions/inferences: Write a likely preliminary conclusion. Do not exaggerate. Mention positive/negative possibilities. State if impact is strong, moderate, or limited.
    8. BM tools: Suggest 4 to 5 suitable tools. Always include "Ratio Analysis" if financials are involved. For each tool, write a 2-3 sentence explanation of how it helps analyze this specific issue. Use standard tools such as SWOT, STEEPLE, Ansoff, BCG, Porter's Five Forces, Stakeholder Analysis, Competitor Analysis, Ratio Analysis, Marketing Mix 7Ps, Brand Positioning Map, Force Field Analysis, Lewin's Change Model, CSR Analysis, etc.
    9. Secondary data suggestions: Suggest what secondary data can be used (e.g., annual reports, sustainability reports, newspaper articles, competitor data).

    You always output strictly valid JSON in the requested schema.`;

    prompt = `Generate 5 high-scoring Business Management IA research questions and proposal outlines for the query/sector: "${keyword}".
    
    Ensure all topics focus on recently launched initiatives (since late 2024/2025/2026), but do not mention the year in the Title. Ensure each topic is distinct, creative, and academically rigorous.`;
  } else if (mode === GenerationMode.MATH_IA) {
    systemInstruction = `You are an expert IB Mathematics Internal Assessment (IA) and Extended Essay (EE) advisor.
    Your task is to generate original, student-friendly, high-scoring IB Mathematics IA topic ideas for both Mathematics: Analysis and Approaches (AA) and Mathematics: Applications and Interpretation (AI), at SL and HL level.

    The topic ideas must allow a clean, academic mathematical exploration over 12-20 pages, showing appropriate mathematical terminology, notation, reflection, and personal engagement.

    CONSTRAINTS for mathProposal:
    - title: Strong mathematical and real-world descriptive title. It MUST be highly detailed, specific, and written in between 12 and 15 words (count the words carefully: exactly 12, 13, 14, or 15 words).
    - researchQuestion: MUST start with “To what extent”, “How accurately”, “How can”, “What is the relationship between”, or “Can mathematics model” and be extremely specific.
    - suitableCourse: Specify "Mathematics: Analysis and Approaches (AA)" or "Mathematics: Applications and Interpretation (AI)" or both.
    - level: "SL", "HL", or "SL and HL".
    - mathematicalArea: One or more areas (e.g., Calculus, Statistics, Probability, Modelling, Geometry, Trigonometry, Functions, Vectors, Differential Equations, Optimisation, Sequences, Graph Theory, etc.).
    - mathematicalTools: Detailed list of mathematical formulas, methods, equations, or theorems to be used.
    - realWorldContext: Context such as sport, music, economics, architecture, games, medicine, physics, astronomy, health, environment, or technology.
    - dataNeeded: What specific raw or secondary data is required and how or where to extract it.
    - possibleTechnology: Software or calculator tools (e.g., Geogebra, Desmos, Logger Pro, Excel, TI-Nspire, R, Python).
    - whyStrongTopic: What makes this topic academically and structurally viable for a student to get maximum marks.
    - possiblePersonalEngagement: Creative ways the student can connect this to personal interests or activities to showcase engagement.
    - possibleLimitations: Specific details on assumptions, approximations, or missing variables that the student must reflect on.
    - difficultyLevel: "Easy", "Medium", or "Hard".

    You always output strictly valid JSON in the requested schema.`;

    const interest = mathFilters?.interestArea && mathFilters.interestArea !== "Any" ? mathFilters.interestArea : (keyword || "General Interest");
    const course = mathFilters?.course && mathFilters.course !== "Any" ? mathFilters.course : "AA or AI";
    const level = mathFilters?.level && mathFilters.level !== "Any" ? mathFilters.level : "SL or HL";
    const math = mathFilters?.mathArea && mathFilters.mathArea !== "Any" ? mathFilters.mathArea : "calculus, statistics, probability, modelling, geometry, trigonometry, functions, vectors, differential equations, optimisation, sequences, or graph theory";
    const dtype = mathFilters?.dataType && mathFilters.dataType !== "Any" ? mathFilters.dataType : "Primary or Secondary data";
    const dif = mathFilters?.difficulty && mathFilters.difficulty !== "Any" ? mathFilters.difficulty : "Easy, Moderate, or Advanced";
    const location = mathFilters?.country ? `in the context/location of ${mathFilters.country}` : "";

    const count = mathFilters?.count || 10;

    prompt = `Generate EXACTLY ${count} original, student-friendly, and high-scoring IB Mathematics IA topic ideas following these parameters:
    - Student Interest Area: ${interest}
    - Course: ${course}
    - Level: ${level}
    - Preferred Mathematics: ${math}
    - Data Type: ${dtype}
    ${location ? `- Local context / Country: ${location}` : ""}
    - Difficulty Level: ${dif}
    ${keyword ? `- Additional search keywords: ${keyword}` : ""}

    Every single topic of the ${count} must allow graphs, modeling, calculations, and reflection.
    CRITICAL: The main "title" field and the "mathProposal.title" field for each of these items MUST be extremely detailed and written with between 12 and 15 words. It should define precisely the specific mathematical focus and real-world system being analyzed (e.g., "An investigation into using calculus to optimize the fuel efficiency of hybrid cars in India" - 15 words). Ensure the math matches the requested level (${level}) and syllabus (${course}).`;
  } else {
    systemInstruction = `You are an expert academic advisor and trend forecaster. Your goal is to help researchers find the 'bleeding edge' of their fields. You combine obscure cross-disciplinary insights with current global trends. 
    You always output strictly valid JSON in the requested schema.`;
    
    prompt = `Generate 5 creative, highly specific, and trending research topics based on the field/keyword: "${keyword}".
    
    CRITICAL CONSTRAINTS:
    - DO NOT repeat these previous ideas: ${history.join(", ")}
    - Ensure the topics are relevant to current events or emerging trends in 2024-2026.
    - Be extremely creative; avoid generic "History of..." or "Impact of..." topics.
    - Each topic must feel unique and research-worthy.
    - Return a JSON array of objects.`;
  }

  // Define properties for responseSchema based on mode to keep it precise
  const propertiesObj: any = {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    relevance: { type: Type.STRING, description: "Why this is trending or relevant now" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    trendingScore: { type: Type.NUMBER, description: "Score from 0-100 indicating trendiness" }
  };

  if (mode === GenerationMode.BM_IA) {
    propertiesObj.proposal = {
      type: Type.OBJECT,
      properties: {
        companyName: { type: Type.STRING },
        companyDescription: { type: Type.STRING },
        issueToEvaluate: { type: Type.STRING },
        direction: { type: Type.STRING },
        evaluationReason: { type: Type.STRING },
        conceptInvolved: { type: Type.STRING },
        conclusionsInferences: { type: Type.STRING },
        bmTools: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["name", "explanation"]
          }
        },
        secondaryDataSuggestions: { type: Type.STRING }
      },
      required: [
        "companyName",
        "companyDescription",
        "issueToEvaluate",
        "direction",
        "evaluationReason",
        "conceptInvolved",
        "conclusionsInferences",
        "bmTools",
        "secondaryDataSuggestions"
      ]
    };
  } else if (mode === GenerationMode.MATH_IA) {
    propertiesObj.mathProposal = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        researchQuestion: { type: Type.STRING },
        suitableCourse: { type: Type.STRING },
        level: { type: Type.STRING },
        mathematicalArea: { type: Type.STRING },
        mathematicalTools: { type: Type.STRING },
        realWorldContext: { type: Type.STRING },
        dataNeeded: { type: Type.STRING },
        possibleTechnology: { type: Type.STRING },
        whyStrongTopic: { type: Type.STRING },
        possiblePersonalEngagement: { type: Type.STRING },
        possibleLimitations: { type: Type.STRING },
        difficultyLevel: { type: Type.STRING }
      },
      required: [
        "title",
        "researchQuestion",
        "suitableCourse",
        "level",
        "mathematicalArea",
        "mathematicalTools",
        "realWorldContext",
        "dataNeeded",
        "possibleTechnology",
        "whyStrongTopic",
        "possiblePersonalEngagement",
        "possibleLimitations",
        "difficultyLevel"
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: propertiesObj,
            required: mode === GenerationMode.BM_IA 
              ? ["id", "title", "description", "relevance", "tags", "trendingScore", "proposal"]
              : mode === GenerationMode.MATH_IA
                ? ["id", "title", "description", "relevance", "tags", "trendingScore", "mathProposal"]
                : ["id", "title", "description", "relevance", "tags", "trendingScore"]
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateAbstract = async (topic: ResearchTopic): Promise<string> => {
  let prompt = "";
  if (topic.proposal) {
    prompt = `Write a high-quality, professional, Peer-Reviewed, HD-level academic background and methodological approach statement for this IB BM IA research proposal:
    
    RESEARCH QUESTION: ${topic.title}
    COMPANY: ${topic.proposal.companyName} (${topic.proposal.companyDescription})
    ISSUE OBJECTIVE: ${topic.proposal.issueToEvaluate}
    KEY CONCEPT: ${topic.proposal.conceptInvolved}
    DIRECTION: ${topic.proposal.direction}
    DESIRED OUTCOMES: ${topic.proposal.conclusionsInferences}
    BUSINESS TOOLS TO EMPLOY: ${topic.proposal.bmTools.map(t => `${t.name}: ${t.explanation}`).join("; ")}
    
    CONSTRAINTS:
    - Language: Sophisticated, flawless academic terminology that adheres to maximum IB score criteria.
    - Word count: ~250-300 words of heavy analytical quality.
    - Structure: Frame the rationale, explain how the selected business tools will decode the strategic initiative, and establish how backward-looking numerical and qualitative data will validate the conclusion.
    - Tone: Formal, objective, and scholarly.
    - Format: Return a single detailed paragraph of immaculate academic prose.`;
  } else if (topic.mathProposal) {
    prompt = `Write a high-quality, professional, Peer-Reviewed, Grade 7 level academic background and mathematical methodology statement for this IB Mathematics IA proposal:
    
    TITLE: ${topic.title}
    RESEARCH QUESTION: ${topic.mathProposal.researchQuestion}
    SUITABLE COURSE & LEVEL: ${topic.mathProposal.suitableCourse} (${topic.mathProposal.level})
    MATHEMATICAL AREA: ${topic.mathProposal.mathematicalArea}
    MATHEMATICAL TOOLS & CONCEPTS: ${topic.mathProposal.mathematicalTools}
    REAL-WORLD CONTEXT: ${topic.mathProposal.realWorldContext}
    DATA NEEDED & METHOD: ${topic.mathProposal.dataNeeded}
    POSSIBLE TECHNOLOGY: ${topic.mathProposal.possibleTechnology}
    
    CONSTRAINTS:
    - Language: Math-focused, academically rigorous, precise, and structured that adheres to the Criterion D (Reflection) and Criterion E (Use of mathematics) of the IB Mathematics IA.
    - Word count: ~250-300 words.
    - Structure: Frame the rationale, explain how the selected mathematical tools and functions will model the real-world scenario, and outline any necessary assumptions or variables.
    - Tone: Formal, objective, and scholarly.
    - Format: Return a single detailed paragraph of immaculate mathematical-academic prose.`;
  } else {
    prompt = `Write a high-quality, PhD-level academic abstract for the following research topic:
    
    TITLE: ${topic.title}
    DESCRIPTION: ${topic.description}
    RELEVANCE: ${topic.relevance}
    TAGS: ${topic.tags.join(", ")}
    
    CONSTRAINTS:
    - Language: Academic, rigorous, and precise.
    - Structure: 250-300 words.
    - Content: Include background/context, the specific research gap being addressed, proposed methodology (creative/modern), and expected contribution to the field.
    - Tone: Formal and authoritative.
    - Format: Return a single detailed paragraph.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior academic peer reviewer and professor. Your writing is legendary for its clarity, precision, and depth. You use sophisticated vocabulary and complex sentence structures appropriate for high-impact journals.",
      }
    });

    return response.text || "Failed to generate abstract.";
  } catch (error) {
    console.error("Gemini Abstract Error:", error);
    throw error;
  }
};
