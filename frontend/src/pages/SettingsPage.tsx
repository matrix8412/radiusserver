import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { SystemSetting } from '../types';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  React.useEffect(() => {
    if (data) {
      const v: Record<string, string> = {};
      data.forEach((s) => { v[s.key] = s.value; });
      setValues(v);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) =>
      Promise.all(settings.map((s) => api.put(`/settings/${s.key}`, { value: s.value }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSnack({ open: true, message: t('settings.saved'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  const handleSave = () => {
    if (!data) return;
    const changed = data
      .filter((s) => values[s.key] !== s.value)
      .map((s) => ({ key: s.key, value: values[s.key] }));
    if (changed.length > 0) saveMutation.mutate(changed);
  };

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('settings.title')}</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>{t('settings.save')}</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('settings.key')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('settings.value')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('settings.description')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).map((setting) => (
              <TableRow key={setting.key}>
                <TableCell><Typography variant="body2" fontFamily="monospace">{setting.key}</Typography></TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={values[setting.key] || ''}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                    fullWidth
                  />
                </TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{setting.description}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
