import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Economics() {
  const [news, setNews] = useState([]);
  const [economicData, setEconomicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEconomicData();
  }, []);

  const fetchEconomicData = async () => {
    try {
      // Placeholder for FRED API integration
      setNews([
        {
          id: 1,
          title: "Federal Reserve Announces Interest Rate Decision",
          summary: "The Fed maintains current rates amid economic uncertainty",
          source: "Reuters",
          publishedAt: "2024-01-15T10:00:00Z",
          url: "#"
        },
        {
          id: 2,
          title: "GDP Growth Exceeds Expectations",
          summary: "Q4 GDP growth shows strong economic momentum",
          source: "Bloomberg",
          publishedAt: "2024-01-14T14:30:00Z",
          url: "#"
        }
      ]);

      setEconomicData([
        {
          id: 1,
          indicator: "Federal Funds Rate",
          value: "5.25%",
          change: "0.00%",
          lastUpdate: "2024-01-15"
        },
        {
          id: 2,
          indicator: "Unemployment Rate",
          value: "3.7%",
          change: "-0.1%",
          lastUpdate: "2024-01-10"
        },
        {
          id: 3,
          indicator: "CPI Inflation",
          value: "3.2%",
          change: "+0.1%",
          lastUpdate: "2024-01-12"
        }
      ]);
    } catch (error) {
      console.error('Error fetching economic data:', error);
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
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline" 
            className="border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Economic Data & News</h1>
            <p className="text-gray-400">Stay updated with economic indicators and market news</p>
          </div>
        </div>

        <Tabs defaultValue="indicators" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="indicators" className="text-white data-[state=active]:bg-green-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Economic Indicators
            </TabsTrigger>
            <TabsTrigger value="news" className="text-white data-[state=active]:bg-green-600">
              <Calendar className="w-4 h-4 mr-2" />
              Economic News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indicators" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {economicData.map((indicator) => (
                <Card key={indicator.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{indicator.indicator}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Last updated: {new Date(indicator.lastUpdate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-400">{indicator.value}</span>
                      <Badge 
                        variant={indicator.change.startsWith('+') ? 'default' : 'secondary'}
                        className={indicator.change.startsWith('+') ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {indicator.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <div className="space-y-4">
              {news.map((article: any) => (
                <Card key={article.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{article.title}</CardTitle>
                        <CardDescription className="text-gray-300">{article.summary}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:bg-gray-800"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{article.source}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}