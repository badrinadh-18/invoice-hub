import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/reset-password/${token}`);
        if (res.data?.success) {
          setValid(true);
        } else {
          throw new Error('Invalid token');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Invalid or expired reset token.');
        setValid(false);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    const toastId = toast.loading('Resetting password...');
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data?.success) {
        toast.success('Password has been reset. You can now log in.', { id: toastId });
        navigate('/login');
      } else {
        throw new Error(res.data?.message || 'Reset failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed', { id: toastId });
    }
  };

  if (loading) {
    return <div className="p-4">Verifying token...</div>;
  }

  if (!valid) {
    return <div className="p-4 text-red-600">Invalid or expired token.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}

