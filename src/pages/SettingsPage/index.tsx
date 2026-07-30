import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './style.module.css';

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <h2 className={styles.title}>设置</h2>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>账户</div>
        <div className={styles.setCard}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>身份认证</span>
            <span className={styles.rowValue}>aSSO</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>退出登录</button>
        </div>
      </div>
    </div>
  );
}
