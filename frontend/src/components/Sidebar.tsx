import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import TuneIcon from '@mui/icons-material/Tune';
import RouterIcon from '@mui/icons-material/Router';
import WifiIcon from '@mui/icons-material/Wifi';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PolicyIcon from '@mui/icons-material/Policy';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, mobileOpen, onClose, isMobile }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const radiusItems = [
    { text: t('nav.users'), icon: <PeopleIcon />, path: '/users' },
    { text: t('nav.groups'), icon: <GroupIcon />, path: '/groups' },
    { text: t('nav.attributes'), icon: <TuneIcon />, path: '/attributes' },
    { text: t('nav.nas'), icon: <RouterIcon />, path: '/nas' },
    { text: t('nav.sessions'), icon: <WifiIcon />, path: '/sessions' },
    { text: t('nav.authLogs'), icon: <HistoryIcon />, path: '/auth-logs' },
  ];

  const managementItems = [
    { text: t('nav.admins'), icon: <AdminPanelSettingsIcon />, path: '/admins' },
    { text: t('nav.roles'), icon: <SecurityIcon />, path: '/roles' },
    { text: t('nav.audit'), icon: <PolicyIcon />, path: '/audit' },
  ];

  const systemItems = [
    { text: t('nav.settings'), icon: <SettingsIcon />, path: '/settings' },
    { text: t('nav.certificates'), icon: <VerifiedUserIcon />, path: '/certificates' },
    { text: t('nav.health'), icon: <MonitorHeartIcon />, path: '/health' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <>
      <Toolbar />
      <List>
        <ListItemButton
          selected={location.pathname === '/dashboard'}
          onClick={() => handleNav('/dashboard')}
        >
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary={t('nav.dashboard')} />
        </ListItemButton>
      </List>
      <Divider />
      <List subheader={<ListSubheader>{t('nav.radius')}</ListSubheader>}>
        {radiusItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNav(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List subheader={<ListSubheader>{t('nav.management')}</ListSubheader>}>
        {managementItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNav(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List subheader={<ListSubheader>{t('nav.system')}</ListSubheader>}>
        {systemItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNav(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
