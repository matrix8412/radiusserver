import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DataTable, { type Column } from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import type { RadPostAuth } from '../types';

const AuthLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays] = useState(90);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['authLogs', page, rowsPerPage, search],
    queryFn: async () => (await api.get('/logs/auth', { params: { page: page + 1, limit: rowsPerPage, username: search } })).data,
  });

  const purgeMutation = useMutation({
    mutationFn: async (days: number) => api.post('/logs/purge', { days }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['authLogs'] });
      setPurgeOpen(false);
      setSnack({ open: true, message: t('authLogs.purged', { count: res.data.deleted || 0 }), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const columns: Column<RadPostAuth>[] = [
    { id: 'username', label: t('authLogs.username'), minWidth: 120 },
    {
      id: 'reply', label: t('authLogs.reply'), minWidth: 100,
      render: (row) => (
        <Chip
          label={row.reply === 'Access-Accept' ? t('authLogs.success') : t('authLogs.reject')}
          color={row.reply === 'Access-Accept' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    { id: 'nasipaddress', label: t('authLogs.nasIp'), minWidth: 120 },
    { id: 'callingstationid', label: t('authLogs.callingStation'), minWidth: 140 },
    { id: 'authdate', label: t('authLogs.date'), minWidth: 180, render: (row) => new Date(row.authdate).toLocaleString() },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('authLogs.title')}</Typography>
        <Button variant="outlined" color="warning" startIcon={<DeleteSweepIcon />} onClick={() => setPurgeOpen(true)}>
          {t('authLogs.purge')}
        </Button>
      </Box>
      <TextField placeholder={t('app.search')} size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ mb: 2, minWidth: 300 }} />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0); }}
        loading={isLoading}
      />

      <ConfirmDialog
        open={purgeOpen}
        title={t('authLogs.purge')}
        message={t('authLogs.purgeConfirm')}
        onConfirm={() => purgeMutation.mutate(purgeDays)}
        onCancel={() => setPurgeOpen(false)}
        confirmColor="warning"
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AuthLogsPage;
