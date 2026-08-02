import styles from './style.module.css';

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>My<span>OKR</span></div>
        <p className={styles.desc}>极简的个人 OKR 目标管理工具</p>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>登录</h2>
          <a className={styles.ssoButton} href="/api/auth/sso/login">
            使用 aSSO 登录
          </a>
        </div>
        <p className={styles.hint}>首次登录将自动创建 MyOKR 账户</p>
      </div>
    </div>
  );
}
