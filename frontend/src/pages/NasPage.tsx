import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DataTable, { type Column } from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import type { NasDevice, PaginatedResult } from '../types';

const NasPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNas, setEditNas] = useState<NasDevice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NasDevice | null>(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ nasname: '', shortname: '', type: 'other', ports: '', secret: '', server: '', community: '', description: '' });

  const { data, isLoading } = useQuery<PaginatedResult<NasDevice>>({
    queryKey: ['nas', page, rowsPerPage, search],
    queryFn: async () => (await api.get('/nas', { params: { page: page + 1, limit: rowsPerPage, search } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editNas) return api.put(`/nas/${editNas.id}`, payload);
      return api.post('/nas', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nas'] });
      setDialogOpen(false);
      setSnack({ open: true, message: editNas ? t('nas.updated') : t('nas.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/nas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nas'] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('nas.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditNas(null);
    setForm({ nasname: '', shortname: '', type: 'other', ports: '', secret: '', server: '', community: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (nas: NasDevice) => {
    setEditNas(nas);
    setForm({ nasname: nas.nasname, shortname: nas.shortname, type: nas.type, ports: nas.ports?.toString() || '', secret: nas.secret, server: nas.server || '', community: nas.community || '', description: nas.description });
    setDialogOpen(true);
  };

  const columns: Column<NasDevice>[] = [
    { id: 'nasname', label: t('nas.nasname'), minWidth: 140 },
    { id: 'shortname', label: t('nas.shortname'), minWidth: 120 },
    { id: 'type', label: t('nas.type'), minWidth: 80 },
    { id: 'secret', label: t('nas.secret'), minWidth: 100, render: () => '••••••' },
    { id: 'description', label: t('nas.description'), minWidth: 200 },
    {
      id: 'actions', label: t('app.actions'), minWidth: 100,
      render: (row) => (
        <Box>
          <Tooltip title={t('app.edit')}><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('app.delete')}><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('nas.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('nas.create')}</Button>
      </Box>
      <TextField placeholder={t('app.search')} size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ mb: 2, minWidth: 300 }} />
      <DataTable
        columns={columns}
        rows={(data?.data || []) as unknown as Record<string, unknown>[]}
        total={data?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0); }}
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editNas ? t('nas.edit') : t('nas.create')}</DialogTitle>
        <DialogContent>
          <TextField label={t('nas.nasname')} fullWidth margin="normal" value={form.nasname} onChange={(e) => setForm({ ...form, nasname: e.target.value })} required />
          <TextField label={t('nas.shortname')} fullWidth margin="normal" value={form.shortname} onChange={(e) => setForm({ ...form, shortname: e.target.value })} required />
          <TextField label={t('nas.type')} fullWidth margin="normal" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <TextField label={t('nas.ports')} type="number" fullWidth margin="normal" value={form.ports} onChange={(e) => setForm({ ...form, ports: e.target.value })} />
          <TextField label={t('nas.secret')} fullWidth margin="normal" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} required />
          <TextField label={t('nas.description')} fullWidth margin="normal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate({ ...form, ports: form.ports ? parseInt(form.ports) : null })}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('nas.deleteConfirm', { shortname: deleteTarget?.shortname })}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default NasPage;
