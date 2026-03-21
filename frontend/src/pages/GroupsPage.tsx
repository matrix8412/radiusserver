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
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
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
import type { RadiusGroup, PaginatedResult } from '../types';

const GroupsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<RadiusGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RadiusGroup | null>(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ groupname: '', description: '', priority: 0, is_enabled: true });

  const { data, isLoading } = useQuery<PaginatedResult<RadiusGroup>>({
    queryKey: ['groups', page, rowsPerPage, search],
    queryFn: async () => (await api.get('/groups', { params: { page: page + 1, limit: rowsPerPage, search } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editGroup) return api.put(`/groups/${editGroup.id}`, payload);
      return api.post('/groups', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDialogOpen(false);
      setSnack({ open: true, message: editGroup ? t('groups.updated') : t('groups.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('groups.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditGroup(null);
    setForm({ groupname: '', description: '', priority: 0, is_enabled: true });
    setDialogOpen(true);
  };

  const openEdit = (group: RadiusGroup) => {
    setEditGroup(group);
    setForm({ groupname: group.groupname, description: group.description, priority: group.priority, is_enabled: group.is_enabled });
    setDialogOpen(true);
  };

  const columns: Column<RadiusGroup>[] = [
    { id: 'groupname', label: t('groups.groupname'), minWidth: 150 },
    { id: 'description', label: t('groups.description'), minWidth: 200 },
    { id: 'priority', label: t('groups.priority'), minWidth: 80 },
    {
      id: 'is_enabled', label: t('app.status'), minWidth: 80,
      render: (row) => <Chip label={row.is_enabled ? t('app.enabled') : t('app.disabled')} color={row.is_enabled ? 'success' : 'default'} size="small" />,
    },
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
        <Typography variant="h4">{t('groups.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('groups.create')}</Button>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editGroup ? t('groups.edit') : t('groups.create')}</DialogTitle>
        <DialogContent>
          <TextField label={t('groups.groupname')} fullWidth margin="normal" value={form.groupname} onChange={(e) => setForm({ ...form, groupname: e.target.value })} disabled={!!editGroup} required />
          <TextField label={t('groups.description')} fullWidth margin="normal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label={t('groups.priority')} type="number" fullWidth margin="normal" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
          <FormControlLabel control={<Switch checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} />} label={t('groups.enabled')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate(form)}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('groups.deleteConfirm', { groupname: deleteTarget?.groupname })}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupsPage;
