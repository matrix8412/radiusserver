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
import LockResetIcon from '@mui/icons-material/LockReset';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DataTable, { type Column } from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import type { RadiusUser, PaginatedResult } from '../types';

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<RadiusUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RadiusUser | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<RadiusUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [totpUser, setTotpUser] = useState<RadiusUser | null>(null);
  const [totpData, setTotpData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', email: '', phone: '',
    is_enabled: true, simultaneous_use: 1, download_limit: 0, upload_limit: 0, notes: '',
  });

  const { data, isLoading } = useQuery<PaginatedResult<RadiusUser>>({
    queryKey: ['users', page, rowsPerPage, search],
    queryFn: async () => (await api.get('/users', { params: { page: page + 1, limit: rowsPerPage, search } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editUser) {
        return api.put(`/users/${editUser.id}`, payload);
      }
      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setSnack({ open: true, message: editUser ? t('users.updated') : t('users.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('users.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const pwdMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) =>
      api.post(`/users/${id}/reset-password`, { password }),
    onSuccess: () => {
      setPwdDialogOpen(false);
      setNewPassword('');
      setSnack({ open: true, message: t('users.passwordReset'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', password: '', full_name: '', email: '', phone: '', is_enabled: true, simultaneous_use: 1, download_limit: 0, upload_limit: 0, notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (user: RadiusUser) => {
    setEditUser(user);
    setForm({
      username: user.username, password: '', full_name: user.full_name, email: user.email,
      phone: user.phone, is_enabled: user.is_enabled, simultaneous_use: user.simultaneous_use,
      download_limit: user.download_limit, upload_limit: user.upload_limit, notes: user.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = { ...form };
    if (editUser && !form.password) delete payload.password;
    saveMutation.mutate(payload);
  };

  const setupTotp = async (user: RadiusUser) => {
    try {
      const { data } = await api.post(`/users/${user.id}/totp/setup`);
      setTotpUser(user);
      setTotpData(data);
      setTotpCode('');
    } catch {
      setSnack({ open: true, message: t('app.error'), severity: 'error' });
    }
  };

  const verifyTotp = async () => {
    if (!totpUser) return;
    try {
      await api.post(`/users/${totpUser.id}/totp/verify`, { token: totpCode });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTotpUser(null);
      setTotpData(null);
      setSnack({ open: true, message: t('app.success'), severity: 'success' });
    } catch {
      setSnack({ open: true, message: t('app.error'), severity: 'error' });
    }
  };

  const columns: Column<RadiusUser>[] = [
    { id: 'username', label: t('users.username'), minWidth: 120 },
    { id: 'full_name', label: t('users.fullName'), minWidth: 150 },
    { id: 'email', label: t('users.email'), minWidth: 150 },
    {
      id: 'is_enabled', label: t('app.status'), minWidth: 80,
      render: (row) => <Chip label={row.is_enabled ? t('app.enabled') : t('app.disabled')} color={row.is_enabled ? 'success' : 'default'} size="small" />,
    },
    {
      id: 'totp_enabled', label: t('users.totp'), minWidth: 70,
      render: (row) => row.totp_enabled ? <Chip label="TOTP" color="info" size="small" /> : null,
    },
    {
      id: 'actions', label: t('app.actions'), minWidth: 160,
      render: (row) => (
        <Box>
          <Tooltip title={t('app.edit')}><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('users.resetPassword')}><IconButton size="small" onClick={() => { setPwdTarget(row); setPwdDialogOpen(true); setNewPassword(''); }}><LockResetIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('users.totpSetup')}><IconButton size="small" onClick={() => setupTotp(row)}><QrCode2Icon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('app.delete')}><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('users.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('users.create')}</Button>
      </Box>
      <TextField
        placeholder={t('app.search')}
        size="small"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, minWidth: 300 }}
      />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? t('users.edit') : t('users.create')}</DialogTitle>
        <DialogContent>
          <TextField label={t('users.username')} fullWidth margin="normal" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editUser} required />
          <TextField label={t('users.password')} type="password" fullWidth margin="normal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editUser} autoComplete="new-password" />
          <TextField label={t('users.fullName')} fullWidth margin="normal" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <TextField label={t('users.email')} fullWidth margin="normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label={t('users.phone')} fullWidth margin="normal" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label={t('users.simultaneousUse')} type="number" fullWidth margin="normal" value={form.simultaneous_use} onChange={(e) => setForm({ ...form, simultaneous_use: parseInt(e.target.value) || 0 })} />
          <TextField label={t('users.downloadLimit')} type="number" fullWidth margin="normal" value={form.download_limit} onChange={(e) => setForm({ ...form, download_limit: parseInt(e.target.value) || 0 })} />
          <TextField label={t('users.uploadLimit')} type="number" fullWidth margin="normal" value={form.upload_limit} onChange={(e) => setForm({ ...form, upload_limit: parseInt(e.target.value) || 0 })} />
          <TextField label={t('users.notes')} fullWidth margin="normal" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} />} label={t('users.enabled')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('users.deleteConfirm', { username: deleteTarget?.username })}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Password Reset Dialog */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('users.resetPassword')}</DialogTitle>
        <DialogContent>
          <TextField label={t('users.newPassword')} type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwdDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => pwdTarget && pwdMutation.mutate({ id: pwdTarget.id, password: newPassword })}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <Dialog open={!!totpData} onClose={() => { setTotpUser(null); setTotpData(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{t('users.totpSetup')}</DialogTitle>
        <DialogContent>
          {totpData && (
            <Box textAlign="center">
              <Typography variant="body2" sx={{ mb: 2 }}>{t('users.totpScanQR')}</Typography>
              <Box sx={{ mb: 2 }}>
                <img src={totpData.qrCode} alt="TOTP QR Code" style={{ maxWidth: 200 }} />
              </Box>
              <Typography variant="caption" sx={{ mb: 2, wordBreak: 'break-all', display: 'block' }}>
                {t('users.totpSecret')}: {totpData.secret}
              </Typography>
              <TextField label={t('users.totpCode')} fullWidth margin="normal" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} inputProps={{ maxLength: 6 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTotpUser(null); setTotpData(null); }}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={verifyTotp}>{t('users.totpVerify')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
