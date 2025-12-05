'use client';

import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>FinBoard</div>
    </nav>
  );
}
