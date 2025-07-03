import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EconomicData {
  indicator: string;
  data: Array<{
    date: string;
    value: string;
  }>;
}

interface NewsArticle {
  title: string;
  source: { name: string };
  publishedAt: string;
  url: string;
  urlToImage?: string;
  description?: string;
}

export default function Economics() {
  const [loading, setLoading] = useState(true);
  const [economicData, setEconomicData] = useState<EconomicData[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchEconomicData();
    fetchForexNews();
  }, []);

  const fetchEconomicData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/functions/v1/market-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_economic_data',
          data: { indicators: ['GDP', 'UNRATE', 'CPIAUCSL'] }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch economic data');
      }

      const data = await response.json();
      setEconomicData(data.economicData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load economic data. Please try again.",
        variant: "destructive",
      });
      console.error('Error fetching economic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForexNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/functions/v1/market-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_forex_news' })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forex news');
      }

      const data = await response.json();
      setNewsArticles(data.news || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load forex news. Please try again.",
        variant: "destructive",
      });
      console.error('Error fetching forex news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading economic data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Economic Data & News</h1>
          <p className="text-gray-400">Latest economic indicators and forex market news</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Economic Data */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-400" />
                  Economic Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {economicData.length > 0 ? (
                    economicData.map((indicatorData) => (
                      <div key={indicatorData.indicator} className="bg-gray-800/50 p-4 rounded">
                        <h3 className="text-lg font-semibold text-white mb-2">{indicatorData.indicator}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {indicatorData.data.map((point, index) => (
                            <div key={index} className="text-center p-2 bg-gray-700/30 rounded">
                              <div className="text-sm text-gray-400">{point.date}</div>
                              <div className="font-bold text-white">{point.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No economic data available. Please ensure API keys are configured.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forex News */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-400" />
                  Forex News
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newsArticles.length > 0 ? (
                    newsArticles.slice(0, 5).map((article, index) => (
                      <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block hover:text-green-400 transition-colors"
                        >
                          <h4 className="font-semibold text-white mb-1">{article.title}</h4>
                          <div className="text-sm text-gray-400">
                            {article.source.name} • {new Date(article.publishedAt).toLocaleDateString()}
                          </div>
                          {article.description && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{article.description}</p>
                          )}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No forex news available. Please ensure API keys are configured.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
