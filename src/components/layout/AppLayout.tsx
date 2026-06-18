import { Outlet } from 'react-router-dom';
import { CycleProvider } from '../../contexts/CycleContext';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { Header } from './Header';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <CycleProvider>
      <div className={styles.app}>
        <Sidebar />
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
        <TabBar />
      </div>
    </CycleProvider>
  );
}
