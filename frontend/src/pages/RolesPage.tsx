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
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
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
import type { AdminRole } from '../types';

const RolesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<AdminRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permRole, setPermRole] = useState<AdminRole | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, rowsPerPage],
    queryFn: async () => (await api.get('/roles', { params: { page: page + 1, limit: rowsPerPage } })).data,
  });

  const { data: allPerms } = useQuery<string[]>({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/roles/permissions/list')).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editRole) return api.put(`/roles/${editRole.id}`, payload);
      return api.post('/roles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDialogOpen(false);
      setSnack({ open: true, message: editRole ? t('roles.updated') : t('roles.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('roles.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const permMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: string[] }) =>
      api.put(`/roles/${id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setPermDialogOpen(false);
      setSnack({ open: true, message: t('roles.updated'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditRole(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (role: AdminRole) => {
    setEditRole(role);
    setForm({ name: role.name, description: role.description });
    setDialogOpen(true);
  };

  const openPerms = (role: AdminRole) => {
    setPermRole(role);
    setSelectedPerms(role.permissions || []);
    setPermDialogOpen(true);
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const columns: Column<AdminRole>[] = [
    { id: 'name', label: t('roles.name'), minWidth: 150 },
    { id: 'description', label: t('roles.description'), minWidth: 200 },
    {
      id: 'is_system', label: t('roles.isSystem'), minWidth: 80,
      render: (row) => row.is_system ? <Chip label="System" color="info" size="small" /> : null,
    },
    {
      id: 'permissions', label: t('roles.permissions'), minWidth: 100,
      render: (row) => <Chip label={`${(row.permissions || []).length}`} size="small" />,
    },
    {
      id: 'actions', label: t('app.actions'), minWidth: 140,
      render: (row) => (
        <Box>
          <Tooltip title={t('app.edit')}><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('roles.managePermissions')}>
            <Button size="small" onClick={() => openPerms(row)}>{t('roles.permissions')}</Button>
          </Tooltip>
          {!row.is_system && (
            <Tooltip title={t('app.delete')}><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('roles.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('roles.create')}</Button>
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
        <DialogTitle>{editRole ? t('roles.edit') : t('roles.create')}</DialogTitle>
        <DialogContent>
          <TextField label={t('roles.name')} fullWidth margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label={t('roles.description')} fullWidth margin="normal" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate(form)}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={permDialogOpen} onClose={() => setPermDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('roles.managePermissions')} — {permRole?.name}</DialogTitle>
        <DialogContent>
          <FormGroup>
            {(allPerms || []).map((perm) => (
              <FormControlLabel
                key={perm}
                control={<Checkbox checked={selectedPerms.includes(perm)} onChange={() => togglePerm(perm)} />}
                label={perm}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => permRole && permMutation.mutate({ id: permRole.id, permissions: selectedPerms })}>
            {t('app.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('roles.deleteConfirm', { name: deleteTarget?.name })}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RolesPage;
