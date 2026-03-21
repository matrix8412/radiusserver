import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { HealthStatus } from '../types';

const HealthPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: async () => (await api.get('/health')).data,
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  const isHealthy = data.status === 'healthy';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('health.title')}</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => queryClient.invalidateQueries({ queryKey: ['health'] })}>
          {t('app.refresh')}
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">{t('health.status')}:</Typography>
            <Chip
              label={isHealthy ? t('health.healthy') : t('health.unhealthy')}
              color={isHealthy ? 'success' : 'error'}
              size="medium"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('health.timestamp')}: {new Date(data.timestamp).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('health.database')}</Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2">{t('app.status')}:</Typography>
                <Chip label={data.services.database.status} color={data.services.database.status === 'up' ? 'success' : 'error'} size="small" />
              </Box>
              <Typography variant="body2">{t('health.latency')}: {data.services.database.latency}ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('health.freeradius')}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">{t('app.status')}:</Typography>
                <Chip label={data.services.freeradius.status} color={data.services.freeradius.status === 'up' ? 'success' : 'error'} size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{t('health.totalUsers')}</Typography>
              <Typography variant="h4">{data.database.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{t('health.activeSessions')}</Typography>
              <Typography variant="h4">{data.database.activeSessions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{t('health.totalNas')}</Typography>
              <Typography variant="h4">{data.database.totalNas}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HealthPage;
