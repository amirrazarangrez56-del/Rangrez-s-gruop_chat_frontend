import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/chat'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center p-4">
      <div className="bg-[#1f2c34] rounded-2xl shadow-2xl w-full max-w-md p-8 border border-[#2a3942]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#e9edef]">Rangrez's Group</h1>
          <p className="text-[#8696a0] text-sm mt-1">Sign in to continue</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[['Email','email','email','you@example.com'],['Password','password','password','••••••••']].map(([label, name, type, placeholder]) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#8696a0] mb-1">{label}</label>
              <input type={type} required value={form[name]}
                onChange={e => setForm({ ...form, [name]: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a3942] border border-[#374045] text-[#e9edef] rounded-xl focus:outline-none focus:border-[#00a884] transition placeholder-[#4a5568]"
                placeholder={placeholder} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-[#00a884] hover:bg-[#02be9b] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-[#8696a0] text-sm mt-6">
          No account? <Link to="/register" className="text-[#00a884] font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
