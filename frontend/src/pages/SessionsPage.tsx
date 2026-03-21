import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DataTable, { type Column } from '../components/DataTable';
import type { RadAcct } from '../types';

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const SessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page, rowsPerPage, search],
    queryFn: async () => (await api.get('/logs/accounting', { params: { page: page + 1, limit: rowsPerPage, username: search, active: true } })).data,
    refetchInterval: 15_000,
  });

  const columns: Column<RadAcct>[] = [
    { id: 'username', label: t('sessions.username'), minWidth: 120 },
    { id: 'framedipaddress', label: t('sessions.framedIp'), minWidth: 120 },
    { id: 'nasipaddress', label: t('sessions.nasIp'), minWidth: 120 },
    { id: 'acctstarttime', label: t('sessions.startTime'), minWidth: 160, render: (row) => row.acctstarttime ? new Date(row.acctstarttime).toLocaleString() : '' },
    { id: 'acctsessiontime', label: t('sessions.sessionTime'), minWidth: 120, render: (row) => formatDuration(row.acctsessiontime || 0) },
    { id: 'acctinputoctets', label: t('sessions.inputOctets'), minWidth: 100, render: (row) => formatBytes(row.acctinputoctets || 0) },
    { id: 'acctoutputoctets', label: t('sessions.outputOctets'), minWidth: 100, render: (row) => formatBytes(row.acctoutputoctets || 0) },
    { id: 'callingstationid', label: t('sessions.callingStation'), minWidth: 140 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('sessions.title')}</Typography>
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
    </Box>
  );
};

export default SessionsPage;
