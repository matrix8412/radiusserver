import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import WifiIcon from '@mui/icons-material/Wifi';
import RouterIcon from '@mui/icons-material/Router';
import GroupIcon from '@mui/icons-material/Group';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { DashboardStats } from '../types';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Box sx={{ color, fontSize: 48, display: 'flex' }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const cards: StatCardProps[] = [
    { title: t('dashboard.totalUsers'), value: data.totalUsers, icon: <PeopleIcon fontSize="inherit" />, color: '#1976d2' },
    { title: t('dashboard.activeUsers'), value: data.activeUsers, icon: <CheckCircleIcon fontSize="inherit" />, color: '#2e7d32' },
    { title: t('dashboard.disabledUsers'), value: data.disabledUsers, icon: <BlockIcon fontSize="inherit" />, color: '#d32f2f' },
    { title: t('dashboard.activeSessions'), value: data.activeSessions, icon: <WifiIcon fontSize="inherit" />, color: '#ed6c02' },
    { title: t('dashboard.totalNas'), value: data.totalNas, icon: <RouterIcon fontSize="inherit" />, color: '#9c27b0' },
    { title: t('dashboard.totalGroups'), value: data.totalGroups, icon: <GroupIcon fontSize="inherit" />, color: '#0288d1' },
    { title: t('dashboard.authSuccessToday'), value: data.authSuccessToday, icon: <ThumbUpIcon fontSize="inherit" />, color: '#2e7d32' },
    { title: t('dashboard.authFailToday'), value: data.authFailToday, icon: <ThumbDownIcon fontSize="inherit" />, color: '#d32f2f' },
    { title: t('dashboard.trafficIn'), value: formatBytes(data.trafficIn), icon: <ArrowDownwardIcon fontSize="inherit" />, color: '#1976d2' },
    { title: t('dashboard.trafficOut'), value: formatBytes(data.trafficOut), icon: <ArrowUpwardIcon fontSize="inherit" />, color: '#ed6c02' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>{t('dashboard.title')}</Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
