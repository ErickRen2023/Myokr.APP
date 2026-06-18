import { useState } from 'react';
import { resetKey } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/common/Modal';
import styles from './style.module.css';

export function SettingsPage() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [showReset, setShowReset] = useState(false);
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!currentKey.trim()) {
      showToast('请输入当前秘钥');
      return;
    }
    setResetting(true);
    try {
      const res = await resetKey(currentKey.trim());
      if (res.code === 0) {
        setNewKey(res.data.new_secret_key);
      } else {
        showToast(res.message || '重置秘钥失败');
        setShowReset(false);
      }
    } catch {
      showToast('重置秘钥失败，请检查秘钥是否正确');
      setShowReset(false);
    } finally {
      setResetting(false);
    }
  };

  const confirmReset = () => {
    setShowReset(false);
    showToast('秘钥已更换，请妥善保存新秘钥');
    logout();
    window.location.href = '/login';
  };

  const openResetModal = () => {
    setCurrentKey('');
    setNewKey('');
    setShowReset(true);
  };

  return (
    <div>
      <h2 className={styles.title}>设置</h2>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>身份信息</div>
        <div className={styles.setCard}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>当前秘钥</span>
            <span className={styles.rowValue}>****</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>身份创建时间</span>
            <span>—</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>数据周期数</span>
            <span>—</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.dangerTitle}>⚠️ 危险区域</div>
        <div className={styles.dangerCard}>
          <p className={styles.dangerDesc}>生成新秘钥后，旧秘钥将立即失效。丢失秘钥数据不可恢复。</p>
          <button className={styles.dangerBtn} onClick={openResetModal}>生成新秘钥</button>
        </div>
      </div>

      <Modal isOpen={showReset} onClose={() => !resetting && !newKey && setShowReset(false)} title="生成新秘钥">
        {!newKey ? (
          <>
            <p className={styles.warnText}>⚠️ 此操作将使旧秘钥立即失效。请确认已保存当前数据。</p>
            <div className={styles.field}>
              <label className={styles.fLabel}>请输入当前秘钥以验证身份</label>
              <input
                type="password"
                className={styles.fInput}
                placeholder="请输入你的 32 位秘钥"
                maxLength={32}
                value={currentKey}
                onChange={(e) => setCurrentKey(e.target.value)}
              />
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.btnSec} onClick={() => setShowReset(false)} disabled={resetting}>取消</button>
              <button className={styles.btnDanger} onClick={handleReset} disabled={resetting}>
                {resetting ? '生成中...' : '确认生成'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.modalDesc}>以下是你新的身份秘钥，请立即保存：</p>
            <div className={styles.secretBox}>
              <div className={styles.secretVal}>{newKey}</div>
            </div>
            <p className={styles.secretWarn}>⚠️ 请立即保存新秘钥，此弹窗关闭后无法再次查看。</p>
            <div className={styles.modalBtns}>
              <button className={styles.btnSec} onClick={() => setShowReset(false)}>取消</button>
              <button className={styles.btnDanger} onClick={confirmReset}>确认更换</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
