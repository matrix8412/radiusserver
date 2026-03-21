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
import { useAuth } from '../hooks/useAuth';
import type { AdminUser, PaginatedResult } from '../types';

const AdminsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '', is_active: true });

  const { data, isLoading } = useQuery<PaginatedResult<AdminUser>>({
    queryKey: ['admins', page, rowsPerPage],
    queryFn: async () => (await api.get('/admins', { params: { page: page + 1, limit: rowsPerPage } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editAdmin) return api.put(`/admins/${editAdmin.id}`, payload);
      return api.post('/admins', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDialogOpen(false);
      setSnack({ open: true, message: editAdmin ? t('admins.updated') : t('admins.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('admins.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditAdmin(null);
    setForm({ username: '', password: '', email: '', full_name: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setEditAdmin(admin);
    setForm({ username: admin.username, password: '', email: admin.email, full_name: admin.full_name, is_active: admin.is_active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = { ...form };
    if (editAdmin && !form.password) delete payload.password;
    saveMutation.mutate(payload);
  };

  const columns: Column<AdminUser>[] = [
    { id: 'username', label: t('admins.username'), minWidth: 120 },
    { id: 'full_name', label: t('admins.fullName'), minWidth: 150 },
    { id: 'email', label: t('admins.email'), minWidth: 150 },
    {
      id: 'is_active', label: t('app.status'), minWidth: 80,
      render: (row) => <Chip label={row.is_active ? t('app.active') : t('app.inactive')} color={row.is_active ? 'success' : 'default'} size="small" />,
    },
    {
      id: 'last_login', label: t('admins.lastLogin'), minWidth: 160,
      render: (row) => row.last_login ? new Date(row.last_login).toLocaleString() : '—',
    },
    {
      id: 'actions', label: t('app.actions'), minWidth: 100,
      render: (row) => (
        <Box>
          <Tooltip title={t('app.edit')}><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          {row.id !== currentAdmin?.id && (
            <Tooltip title={t('app.delete')}><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('admins.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('admins.create')}</Button>
      </Box>
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
        <DialogTitle>{editAdmin ? t('admins.edit') : t('admins.create')}</DialogTitle>
        <DialogContent>
          <TextField label={t('admins.username')} fullWidth margin="normal" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editAdmin} required />
          <TextField label={t('admins.password')} type="password" fullWidth margin="normal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editAdmin} autoComplete="new-password" />
          <TextField label={t('admins.email')} fullWidth margin="normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <TextField label={t('admins.fullName')} fullWidth margin="normal" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label={t('admins.active')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('admins.deleteConfirm', { username: deleteTarget?.username })}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminsPage;
