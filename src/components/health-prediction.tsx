'use client'

import { useState } from 'react';
import { predictLivestockHealth } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { HealthLog } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import type { PredictLivestockHealthOutput } from '@/ai/flows/predict-livestock-health';

interface HealthPredictionProps {
  animalId: string;
  healthRecords: HealthLog[];
}

export function HealthPrediction({ animalId, healthRecords }: HealthPredictionProps) {
  const [prediction, setPrediction] = useState<PredictLivestockHealthOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    if (healthRecords.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak Cukup Data',
        description: 'Tidak ada riwayat kesehatan untuk dianalisis.',
      });
      setIsLoading(false);
      return;
    }

    const input = {
      animalId,
      healthRecords: healthRecords.map(r => ({
        date: r.date.toISOString().split('T')[0],
        type: r.type,
        detail: r.detail,
        notes: r.notes || '',
      })),
    };

    const result = await predictLivestockHealth(input);
    
    if ('error' in result) {
        setError(result.error);
        toast({
            variant: "destructive",
            title: "Prediksi Gagal",
            description: result.error,
        });
    } else {
        setPrediction(result);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-purple-600" />
          <span>Prediksi Kesehatan AI</span>
        </CardTitle>
        <CardDescription>
          Gunakan AI untuk menganalisis riwayat kesehatan dan memprediksi potensi masalah di masa depan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          <Button onClick={handlePredict} disabled={isLoading} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
               <>
                <Sparkles className="mr-2 h-4 w-4" />
                Dapatkan Prediksi Kesehatan
               </>
            )}
          </Button>

          {error && (
             <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {prediction && prediction.predictedIssues && (
            <div className="w-full space-y-4 mt-4">
                <Alert className="bg-white">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Hasil Prediksi untuk {prediction.animalId}</AlertTitle>
                    <AlertDescription>
                        Berikut adalah potensi masalah kesehatan berdasarkan data yang ada.
                    </AlertDescription>
                </Alert>
                <div className="grid gap-4 md:grid-cols-2">
                    {prediction.predictedIssues.map((issue, index) => (
                        <Card key={index} className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">{issue.issue}</CardTitle>
                                <CardDescription>
                                    Kemungkinan: <span className={`font-bold ${
                                        issue.likelihood.toLowerCase() === 'tinggi' ? 'text-red-600' :
                                        issue.likelihood.toLowerCase() === 'sedang' ? 'text-yellow-600' : 'text-green-600'
                                    }`}>{issue.likelihood}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Rekomendasi:</p>
                                <p className="text-sm">{issue.recommendations}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
