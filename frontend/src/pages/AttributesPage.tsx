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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuItem from '@mui/material/MenuItem';
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

interface Attribute {
  id: number;
  username?: string;
  groupname?: string;
  attribute: string;
  op: string;
  value: string;
}

const OPS = [':=', '==', '+=', '!=', '>', '>=', '<', '<=', '=~', '!~', '=*', '!*'];

const TABS = ['check', 'reply', 'group-check', 'group-reply'] as const;

const AttributesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAttr, setEditAttr] = useState<Attribute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ username: '', groupname: '', attribute: '', op: ':=', value: '' });

  const endpoint = `/attributes/${TABS[tab]}`;
  const isGroup = tab >= 2;
  const nameField = isGroup ? 'groupname' : 'username';

  const { data, isLoading } = useQuery({
    queryKey: ['attributes', TABS[tab], page, rowsPerPage, search],
    queryFn: async () => (await api.get(endpoint, { params: { page: page + 1, limit: rowsPerPage, search } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editAttr) return api.put(`${endpoint}/${editAttr.id}`, payload);
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes', TABS[tab]] });
      setDialogOpen(false);
      setSnack({ open: true, message: editAttr ? t('attributes.updated') : t('attributes.created'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes', TABS[tab]] });
      setDeleteTarget(null);
      setSnack({ open: true, message: t('attributes.deleted'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const openCreate = () => {
    setEditAttr(null);
    setForm({ username: '', groupname: '', attribute: '', op: ':=', value: '' });
    setDialogOpen(true);
  };

  const openEdit = (attr: Attribute) => {
    setEditAttr(attr);
    setForm({ username: attr.username || '', groupname: attr.groupname || '', attribute: attr.attribute, op: attr.op, value: attr.value });
    setDialogOpen(true);
  };

  const columns: Column<Attribute>[] = [
    { id: nameField, label: isGroup ? t('attributes.groupname') : t('attributes.username'), minWidth: 120 },
    { id: 'attribute', label: t('attributes.attribute'), minWidth: 150 },
    { id: 'op', label: t('attributes.op'), minWidth: 60 },
    { id: 'value', label: t('attributes.value'), minWidth: 150 },
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
      <Typography variant="h4" sx={{ mb: 2 }}>{t('attributes.title')}</Typography>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label={t('attributes.checkAttributes')} />
        <Tab label={t('attributes.replyAttributes')} />
        <Tab label={t('attributes.groupCheckAttributes')} />
        <Tab label={t('attributes.groupReplyAttributes')} />
      </Tabs>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField placeholder={t('app.search')} size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 300 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('attributes.create')}</Button>
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
        <DialogTitle>{editAttr ? t('attributes.edit') : t('attributes.create')}</DialogTitle>
        <DialogContent>
          <TextField
            label={isGroup ? t('attributes.groupname') : t('attributes.username')}
            fullWidth margin="normal"
            value={isGroup ? form.groupname : form.username}
            onChange={(e) => setForm({ ...form, [nameField]: e.target.value })}
            disabled={!!editAttr} required
          />
          <TextField label={t('attributes.attribute')} fullWidth margin="normal" value={form.attribute} onChange={(e) => setForm({ ...form, attribute: e.target.value })} required />
          <TextField label={t('attributes.op')} select fullWidth margin="normal" value={form.op} onChange={(e) => setForm({ ...form, op: e.target.value })}>
            {OPS.map((op) => <MenuItem key={op} value={op}>{op}</MenuItem>)}
          </TextField>
          <TextField label={t('attributes.value')} fullWidth margin="normal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('app.cancel')}</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate({ ...form })}>{t('app.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('app.deleteConfirmTitle')}
        message={t('attributes.deleteConfirm')}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AttributesPage;
