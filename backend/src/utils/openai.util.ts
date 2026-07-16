import OpenAI from 'openai';

export const chatbotSystemPrompt = `You are QuantumBot, an expert AI assistant for the Novocrypt platform.
You specialize in quantum computing threats, RSA cryptography, Shor's algorithm, HNDL attacks, Q-Day timeline, 
and post-quantum cryptography. You help users understand their security risks and guide them through the platform. 
Keep answers concise, accurate, and actionable. Always recommend post-quantum migration when appropriate.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-missing',
});

/**
 * Send a chat message and get response using real OpenAI
 */
export async function getChatbotResponse(
  messages: ChatMessage[],
  maxTokens: number = 500
): Promise<{
  response: string;
  tokensUsed: number;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: messages as any,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I encountered an error generating a response.';
    return {
      response,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error.message);
    throw new Error('Failed to communicate with AI provider');
  }
}

/**
 * Get AI-powered personalized recommendations based on risk data
 */
export async function getPersonalizedRecommendations(
  riskData: Record<string, any>
): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a cryptography expert. Based on the user risk profile, provide 5 concise, actionable bullet points for mitigation.' },
        { role: 'user', content: JSON.stringify(riskData) }
      ],
      max_tokens: 300,
      temperature: 0.5,
    });
    
    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n').filter(r => r.trim().length > 0).map(r => r.replace(/^[-*0-9.]+\s*/, '').trim());
  } catch (error) {
    throw new Error('Failed to generate recommendations');
  }
}

/**
 * Generate compliance remediation suggestions
 */
export async function getComplianceRemediations(
  standard: string,
  failedRequirements: string[]
): Promise<Record<string, string>> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a compliance expert. Provide a one-sentence remediation step for each failed requirement. Return as JSON where keys are the requirements and values are the remediation steps.' },
        { role: 'user', content: `Standard: ${standard}\nFailed Requirements: ${JSON.stringify(failedRequirements)}` }
      ],
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result;
  } catch (error) {
    throw new Error('Failed to generate remediations');
  }
}
