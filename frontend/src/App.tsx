import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Box,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { Book, Article, LibraryBooks } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

interface Article {
  id: number;
  title: string;
  authors: string;
  journal: string;
  filePath: string;
  downloadDate: string;
  year?: string;
  volume?: string;
  issue?: string;
  journalIssue?: string;
}

interface Summary {
  id: number;
  filePath: string;
  summary: string;
  markdown: string;
  createdAt: string;
}

interface CombinedSummary {
  id: number;
  date: string;
  content: string;
  createdAt: string;
}

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [combinedSummaries, setCombinedSummaries] = useState<CombinedSummary[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesRes, summariesRes, combinedRes] = await Promise.all([
        axios.get('/api/articles'),
        axios.get('/api/summaries'),
        axios.get('/api/combined-summaries'),
      ]);
      
      setArticles(articlesRes.data);
      setSummaries(summariesRes.data);
      setCombinedSummaries(combinedRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" sx={{ mt: 4, textAlign: 'center' }}>
          Loading Jewish Academic Summaries...
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <LibraryBooks sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Jewish Academic Summaries
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} centered>
            <Tab icon={<Book />} label="Latest Summary" />
            <Tab icon={<Article />} label="All Articles" />
            <Tab icon={<LibraryBooks />} label="All Summaries" />
          </Tabs>
        </Paper>

        {selectedTab === 0 && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Latest Combined Summary
            </Typography>
            {combinedSummaries.length > 0 ? (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {combinedSummaries[0].date}
                    </Typography>
                    <Chip label={`${summaries.length} articles`} color="secondary" />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ '& h2': { color: 'primary.main', mt: 3, mb: 1 }, '& strong': { color: 'text.secondary' } }}>
                    <ReactMarkdown>{combinedSummaries[0].content}</ReactMarkdown>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No combined summaries available.
              </Typography>
            )}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            <Typography variant="h4" gutterBottom>
              All Articles ({articles.length})
            </Typography>
            <Grid container spacing={3}>
              {articles.map((article) => (
                <Grid item xs={12} md={6} key={article.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {article.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Authors:</strong> {article.authors || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Journal:</strong> {article.journal}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Downloaded:</strong> {new Date(article.downloadDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            <Typography variant="h4" gutterBottom>
              All Summaries ({summaries.length})
            </Typography>
            <Grid container spacing={3}>
              {summaries.map((summary) => {
                const article = articles.find(a => a.filePath === summary.filePath);
                return (
                  <Grid item xs={12} key={summary.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {article?.title || 'Unknown Title'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Journal:</strong> {article?.journal || 'Unknown'} | 
                          <strong> Authors:</strong> {article?.authors || 'Unknown'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ '& h2': { color: 'primary.main', mt: 2, mb: 1 }, '& strong': { color: 'text.secondary' } }}>
                          <ReactMarkdown>{summary.markdown || summary.summary}</ReactMarkdown>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App; 