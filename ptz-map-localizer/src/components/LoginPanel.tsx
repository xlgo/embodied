import { useEffect, useState } from 'react';
import { getCaptcha, login } from '../api/platformAdapter.js';

interface Props {
  onLoggedIn: () => void;
}

export function LoginPanel({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('system');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [uuidCode, setUuidCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = async () => {
    try {
      const next = await getCaptcha();
      setCaptchaImage(next.imageDataUrl);
      setUuidCode(next.uuidCode);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '验证码获取失败');
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await login(username, password, captcha, uuidCode);
      onLoggedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录失败');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-panel" onSubmit={handleSubmit}>
      <div>
        <h1>球机点击定位</h1>
        <p>登录实景平台后读取设备与云台状态</p>
      </div>
      <label>
        <span>账号</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
      </label>
      <label>
        <span>密码</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
      </label>
      <label>
        <span>验证码</span>
        <div className="captcha-row">
          <input value={captcha} onChange={(event) => setCaptcha(event.target.value)} />
          {captchaImage && <img src={captchaImage} alt="验证码" onClick={refreshCaptcha} />}
        </div>
      </label>
      {message && <div className="message error">{message}</div>}
      <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
    </form>
  );
}
