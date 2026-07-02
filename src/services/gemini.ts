import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKey, getMockMode } from './storage';

export interface GeminiResponse {
  issue_type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
}

// Pre-defined mock data to rotate during Mock AI Mode
const MOCK_ISSUES: GeminiResponse[] = [
  {
    issue_type: 'Pothole',
    severity: 'High',
    description: 'A large, deep pothole in the middle of the asphalt. It poses a high risk to drivers and cyclists, forcing vehicles to swerve.',
  },
  {
    issue_type: 'Broken Streetlight',
    severity: 'Medium',
    description: 'A street lamppost with a burnt-out or broken bulb. The surrounding sidewalk and road area are completely dark at night.',
  },
  {
    issue_type: 'Garbage Accumulation',
    severity: 'Medium',
    description: 'A heap of overflowing trash bins and discarded waste bags left on the sidewalk, causing foul odor and blocking pedestrians.',
  },
  {
    issue_type: 'Broken Bench',
    severity: 'Low',
    description: 'A public park bench with broken wooden slats and exposed rusty nails. Unusable and unsafe for visitors.',
  },
  {
    issue_type: 'Water Leakage',
    severity: 'High',
    description: 'Pressurized clean water leaking from a cracked pipe under the sidewalk, causing minor flooding on the road surface.',
  },
];

/**
 * Helper to convert a local file URI to a Generative AI Part object (base64)
 */
async function fileToGenerativePart(uri: string): Promise<{ inlineData: { data: string; mimeType: string } }> {
  try {
    // In React Native, we can read local file URI to base64 using expo-file-system,
    // or fetch the local file and convert it. Let's do a standard fetch-to-blob-to-base64:
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64data,
            mimeType: blob.type || 'image/jpeg',
          },
        });
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting file to generative part:', error);
    throw error;
  }
}

/**
 * Sends a captured image to Gemini Vision API and retrieves structured details
 */
export async function analyzeIssueImage(imageUri: string): Promise<GeminiResponse> {
  const isMockMode = await getMockMode();

  if (isMockMode) {
    // Simulate API delay of 1.5 seconds to show off the shimmering loader!
    await new Promise((resolve) => setTimeout(resolve, 1800));
    
    // Pick a random mock issue to make tests feel dynamic
    const randomIndex = Math.floor(Math.random() * MOCK_ISSUES.length);
    return MOCK_ISSUES[randomIndex];
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please add it in Settings or enable Mock AI Mode.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-1.5-flash as the standard multimodal model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 
        'You are an expert smart city municipal assistant. Analyze the user-submitted photo of local infrastructure issues. ' +
        'Determine the type of issue (e.g. Pothole, Broken Light, Garbage, Graffiti, Water Leakage, Damaged Sign, etc.), ' +
        'the severity of the issue (Low, Medium, High), and write a brief, objective description of the damage. ' +
        'You must return the analysis strictly as a single JSON object. Do not format with markdown markdown code blocks, just raw JSON.',
    });

    const imagePart = await fileToGenerativePart(imageUri);

    const prompt = 
      'Analyze this infrastructure issue. Return a JSON object matching this schema:\n' +
      '{\n' +
      '  "issue_type": "string (precise name of issue type)",\n' +
      '  "severity": "Low | Medium | High",\n' +
      '  "description": "string (brief summary of what is wrong)"\n' +
      '}';

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [imagePart, { text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Received empty response from Gemini API');
    }

    const parsed: GeminiResponse = JSON.parse(responseText);
    
    // Validate output properties
    if (!parsed.issue_type || !parsed.severity || !parsed.description) {
      throw new Error('Gemini response did not contain all required JSON keys');
    }

    // Standardize severity input
    let severity: 'Low' | 'Medium' | 'High' = 'Medium';
    const lowerSeverity = String(parsed.severity).toLowerCase();
    if (lowerSeverity.includes('low')) severity = 'Low';
    if (lowerSeverity.includes('high')) severity = 'High';

    return {
      issue_type: parsed.issue_type,
      severity,
      description: parsed.description,
    };
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze image with Gemini Vision AI');
  }
}
