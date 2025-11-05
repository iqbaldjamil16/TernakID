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
  prompt: `Anda adalah seorang dokter hewan ahli yang berspesialisasi dalam manajemen kesehatan ternak. Berdasarkan catatan kesehatan yang diberikan, prediksi potensi masalah kesehatan di masa depan untuk ternak dan sarankan tindakan pencegahan.

ID Hewan: {{{animalId}}}

Catatan Kesehatan:
{{#each healthRecords}}
  - Tanggal: {{date}}, Jenis: {{type}}, Detail: {{detail}}, Catatan: {{notes}}
{{/each}}

Berdasarkan riwayat ini, prediksi potensi masalah kesehatan, kemungkinan (Tinggi, Sedang, Rendah), dan rekomendasi. Jawaban harus dalam Bahasa Indonesia.

Contoh output dalam format JSON:
{
  "animalId": "KIT-01",
  "predictedIssues": [
    {
      "issue": "Pneumonia",
      "likelihood": "Sedang",
      "recommendations": "Tingkatkan ventilasi dan pantau gejala pernapasan."
    },
    {
      "issue": "Koreng Kaki",
      "likelihood": "Rendah",
      "recommendations": "Jaga kebersihan dan kekeringan kandang."
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
