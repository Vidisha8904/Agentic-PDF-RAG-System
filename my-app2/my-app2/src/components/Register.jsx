import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../style/register.css'; // Import the CSS file

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:8055/users',
        {
          email,
          password,
          role: 'ce18d1ac-8e87-428d-abc2-2c79ea20b628', // Replace with the role ID for "Authenticated User"
        },
        {
          headers: {
            Authorization: 'vwk7rxJtLyPymnHxB4AqqKDtu3lI8M-9', // Replace with your admin token
          },
        }
      );
      setError('');
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Register</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="auth-input"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="auth-input"
          />
        </div>
        <button type="submit" className="auth-button">Register</button>
      </form>
      <p className="link-text">
        Already have an account? <Link to="/login" className="auth-link">Login</Link>
      </p>
    </div>
  );
};

export default Register;