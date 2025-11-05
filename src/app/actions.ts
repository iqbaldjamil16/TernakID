// src/app/actions.ts
'use server';

import { 
  predictLivestockHealth as predictLivestockHealthFlow, 
  PredictLivestockHealthInput,
  PredictLivestockHealthOutput 
} from '@/ai/flows/predict-livestock-health';

export async function predictLivestockHealth(input: PredictLivestockHealthInput): Promise<PredictLivestockHealthOutput | { error: string }> {
  try {
    const result = await predictLivestockHealthFlow(input);
    if (!result) {
        throw new Error("AI prediction returned no result.");
    }
    return result;
  } catch (error) {
    console.error("Error in predictLivestockHealth action:", error);
    return { error: 'Failed to get health prediction. Please try again later.' };
  }
}
