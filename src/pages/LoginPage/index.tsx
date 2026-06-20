import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateKey, login } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/common/Modal';
import styles from './style.module.css';

export function LoginPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateIdentity, setShowCreateIdentity] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [generatedUserId, setGeneratedUserId] = useState(0);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const auth = useAuth();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (key.trim().length < 8) {
      showToast('请输入有效的秘钥');
      return;
    }
    setLoading(true);
    try {
      const res = await login(key.trim());
      if (res.code === 0) {
        auth.login(res.data.token, res.data.user_id);
        navigate('/');
      } else {
        showToast(res.message || '登录失败');
      }
    } catch {
      showToast('登录失败，请检查秘钥');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdentity = async () => {
    setCreating(true);
    try {
      const res = await generateKey();
      if (res.code === 0) {
        setGeneratedKey(res.data.secret_key);
        setGeneratedToken(res.data.token);
        setGeneratedUserId(res.data.user_id);
        setShowCreateIdentity(true);
      }
    } catch {
      showToast('创建身份失败');
    } finally {
      setCreating(false);
    }
  };

  const confirmCreateIdentity = () => {
    setShowCreateIdentity(false);
    auth.login(generatedToken, generatedUserId);
    navigate('/');
    showToast('新身份已创建，欢迎使用 MyOKR');
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>My<span>OKR</span></div>
        <p className={styles.desc}>极简的个人 OKR 目标管理工具</p>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>登录</h2>
          <div className={styles.field}>
            <label className={styles.label}>秘钥</label>
            <input
              type="password"
              className={styles.input}
              placeholder="请输入你的 32 位秘钥"
              maxLength={32}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className={styles.btnPrimary} onClick={handleLogin} disabled={loading}>
            {loading ? '验证中...' : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                进入 MyOKR
              </>
            )}
          </button>
          <div className={styles.divider}>
            <span>或</span>
          </div>
          <button className={styles.btnSecondary} onClick={handleCreateIdentity} disabled={creating}>
            {creating ? '创建中...' : '✨ 创建新身份'}
          </button>
        </div>
        <p className={styles.hint}>秘钥是你唯一的身份凭证，丢失后数据不可恢复</p>
      </div>

      <Modal isOpen={showCreateIdentity} onClose={confirmCreateIdentity} title="✨ 你的新身份已创建">
        <p className={styles.modalDesc}>以下是你的唯一身份秘钥，请立即保存：</p>
        <div className={styles.secretBox}>
          <div className={styles.secretVal}>{generatedKey}</div>
        </div>
        <p className={styles.secretWarn}>⚠️ 秘钥仅展示一次，关闭后无法再次查看。丢失秘钥将导致数据无法恢复。</p>
        <div className={styles.modalBtns}>
          <button className={styles.btnPrimary} onClick={confirmCreateIdentity}>我已保存，进入 MyOKR</button>
        </div>
      </Modal>
    </div>
  );
}
