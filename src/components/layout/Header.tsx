import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>My<span>OKR</span></div>
    </header>
  );
}
