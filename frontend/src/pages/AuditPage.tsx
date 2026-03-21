import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DataTable, { type Column } from '../components/DataTable';
import type { AuditLogEntry } from '../types';

const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, rowsPerPage, action, entityType],
    queryFn: async () => (await api.get('/audit', { params: { page: page + 1, limit: rowsPerPage, action: action || undefined, entity_type: entityType || undefined } })).data,
  });

  const columns: Column<AuditLogEntry>[] = [
    { id: 'admin_username', label: t('audit.admin'), minWidth: 120 },
    { id: 'action', label: t('audit.action'), minWidth: 100 },
    { id: 'entity_type', label: t('audit.entityType'), minWidth: 100 },
    { id: 'entity_id', label: t('audit.entityId'), minWidth: 80 },
    { id: 'ip_address', label: t('audit.ipAddress'), minWidth: 120 },
    {
      id: 'details', label: t('audit.details'), minWidth: 200,
      render: (row) => <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{JSON.stringify(row.details)}</Typography>,
    },
    { id: 'created_at', label: t('audit.date'), minWidth: 180, render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('audit.title')}</Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          select label={t('audit.action')} size="small" value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {['create', 'update', 'delete', 'login', 'logout'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>
        <TextField
          select label={t('audit.entityType')} size="small" value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {['user', 'group', 'nas', 'admin', 'role', 'setting', 'certificate'].map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
        </TextField>
      </Box>
      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        rows={(data?.data || []) as Record<string, unknown>[]}
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

export default AuditPage;
