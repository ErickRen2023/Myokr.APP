import styles from './Header.module.css';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { ssoProfile } = useAuth();
  const initial = (ssoProfile?.username || 'S').charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>My<span>OKR</span></div>
      {ssoProfile && (
        <div className={styles.profile} title={ssoProfile.username || 'aSSO 用户'}>
          {ssoProfile.avatar ? (
            <img className={styles.avatar} src={ssoProfile.avatar} alt={ssoProfile.username || 'aSSO 头像'} />
          ) : (
            <span className={styles.fallback}>{initial}</span>
          )}
        </div>
      )}
    </header>
  );
}
