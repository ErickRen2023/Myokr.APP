import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSsoResult } from '../api/auth';
import styles from './LoginPage/style.module.css';

export function SsoCallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    // React StrictMode 会在开发环境重复执行 effect；一次性结果只能读取一次。
    if (started.current) return;
    started.current = true;

    const error = new URLSearchParams(window.location.search).get('error');
    if (error) {
      navigate('/login?sso_error=1', { replace: true });
      return;
    }

    getSsoResult()
      .then((response) => {
        const result = response.data;
        if (result.status === 'authenticated' && result.token && result.user_id) {
          login(result.token, result.user_id, {
            username: result.username,
            avatar: result.avatar,
          });
          navigate('/', { replace: true });
          return;
        }
        navigate('/login?sso_error=invalid_callback_payload', { replace: true });
      })
      .catch(() => navigate('/login?sso_error=callback_result_failed', { replace: true }));
  }, [login, navigate]);

  return <div className={styles.page}><div className={styles.container}>正在完成 aSSO 登录…</div></div>;
}
