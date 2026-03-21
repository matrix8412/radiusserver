import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import BuildIcon from '@mui/icons-material/Build';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import type { CertificateInfo } from '../types';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const CertificatesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery<CertificateInfo[]>({
    queryKey: ['certificates'],
    queryFn: async () => (await api.get('/certificates')).data,
  });

  const generateMutation = useMutation({
    mutationFn: async () => api.post('/certificates/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setGenerateOpen(false);
      setSnack({ open: true, message: t('certificates.generated'), severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: t('app.error'), severity: 'error' }),
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('certificates.title')}</Typography>
        <Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => queryClient.invalidateQueries({ queryKey: ['certificates'] })} sx={{ mr: 1 }}>
            {t('certificates.refresh')}
          </Button>
          <Button variant="contained" color="warning" startIcon={<BuildIcon />} onClick={() => setGenerateOpen(true)}>
            {t('certificates.generate')}
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('certificates.name')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('certificates.size')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('certificates.modified')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).map((cert) => (
              <TableRow key={cert.name}>
                <TableCell>{cert.name}</TableCell>
                <TableCell>{formatSize(cert.size)}</TableCell>
                <TableCell>{new Date(cert.modified).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={generateOpen}
        title={t('certificates.generate')}
        message={t('certificates.generateConfirm')}
        onConfirm={() => generateMutation.mutate()}
        onCancel={() => setGenerateOpen(false)}
        confirmColor="warning"
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CertificatesPage;
