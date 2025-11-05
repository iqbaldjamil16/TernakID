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
      issue: z.string().describe('Predicted health issue in Indonesian.'),
      likelihood: z.string().describe('Likelihood of the issue occurring (Tinggi, Sedang, Rendah).'),
      recommendations: z.string().describe('Recommended preventive measures in Indonesian.'),
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
  prompt: `You are an expert veterinarian specializing in livestock health management. Based on the provided health records, predict potential future health issues for the livestock and suggest preventive measures. All outputs (issue, likelihood, and recommendations) must be in Indonesian.

Animal ID: {{{animalId}}}

Health Records:
{{#each healthRecords}}
  - Date: {{date}}, Type: {{type}}, Detail: {{detail}}{{#if notes}}, Notes: {{notes}}{{/if}}
{{/each}}

Based on this history, predict potential health issues, their likelihood (Tinggi, Sedang, or Rendah), and recommendations. The response must be in JSON format.

Example JSON output:
{
  "animalId": "KIT-01",
  "predictedIssues": [
    {
      "issue": "Pneumonia",
      "likelihood": "Sedang",
      "recommendations": "Tingkatkan ventilasi dan pantau gejala pernapasan secara rutin. Pastikan kandang tetap kering dan bersih."
    },
    {
      "issue": "Koreng Kaki (Foot Rot)",
      "likelihood": "Rendah",
      "recommendations": "Jaga kebersihan dan kekeringan area kandang, terutama di sekitar tempat pakan dan minum. Lakukan pemeriksaan kuku secara berkala."
    },
    {
      "issue": "Kembung (Bloat)",
      "likelihood": "Tinggi",
      "recommendations": "Hindari perubahan pakan yang mendadak. Sediakan akses air bersih yang cukup dan berikan pakan serat kasar sebelum ternak digembalakan ke padang rumput hijau."
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
