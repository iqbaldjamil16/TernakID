'use server';

/**
 * @fileOverview Predicts the likelihood of livestock developing certain health issues based on historical health records.
 *
 * - predictLivestockHealth - A function that predicts potential health issues for livestock.
 * - PredictLivestockHealthInput - The input type for the predictLivestockHealth function.
 * - PredictLivestockHealthOutput - The return type for the predictLivestockHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictLivestockHealthInputSchema = z.object({
  healthRecords: z.array(
    z.object({
      date: z.string().describe('Date of the health record.'),
      type: z.string().describe('Type of health event (e.g., Vaccination, Disease, Treatment).'),
      detail: z.string().describe('Details of the health event.'),
      notes: z.string().optional().describe('Optional notes for the health event.'),
    })
  ).describe('Historical health records of the livestock.'),
  animalId: z.string().describe('Unique identifier for the livestock animal.'),
});
export type PredictLivestockHealthInput = z.infer<typeof PredictLivestockHealthInputSchema>;

const PredictLivestockHealthOutputSchema = z.object({
  animalId: z.string().describe('The livestock animal ID.'),
  predictedIssues: z.array(
    z.object({
      issue: z.string().describe('Predicted health issue.'),
      likelihood: z.string().describe('Likelihood of the issue occurring (High, Medium, Low).'),
      recommendations: z.string().describe('Recommended preventive measures.'),
    })
  ).describe('List of predicted health issues and recommendations.'),
});
export type PredictLivestockHealthOutput = z.infer<typeof PredictLivestockHealthOutputSchema>;

export async function predictLivestockHealth(input: PredictLivestockHealthInput): Promise<PredictLivestockHealthOutput> {
  return predictLivestockHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLivestockHealthPrompt',
  input: {schema: PredictLivestockHealthInputSchema},
  output: {schema: PredictLivestockHealthOutputSchema},
  prompt: `You are an expert veterinarian specializing in livestock health management. Based on the provided health records, predict potential future health issues for the livestock and suggest preventive measures.

Animal ID: {{{animalId}}}

Health Records:
{{#each healthRecords}}
  - Date: {{date}}, Type: {{type}}, Detail: {{detail}}, Notes: {{notes}}
{{/each}}

Based on this history, predict potential health issues, likelihood (High, Medium, Low), and recommendations. Be concise.

Output in JSON format:
{
  "animalId": "KIT-01",
  "predictedIssues": [
    {
      "issue": "Pneumonia",
      "likelihood": "Medium",
      "recommendations": "Improve ventilation and monitor for respiratory symptoms."
    },
    {
      "issue": "Foot rot",
      "likelihood": "Low",
      "recommendations": "Maintain clean and dry pen conditions."
    }
  ]
}
`,
});

const predictLivestockHealthFlow = ai.defineFlow(
  {
    name: 'predictLivestockHealthFlow',
    inputSchema: PredictLivestockHealthInputSchema,
    outputSchema: PredictLivestockHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
