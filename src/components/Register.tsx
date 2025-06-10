import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Asegúrate de tener configurado esto

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Error during sign up:', error.message);
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('User registered successfully! Check your email to confirm.');
      setErrorMsg('');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br />
      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br />
      <button onClick={handleRegister}>Register</button>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
    </div>
  );
};

export default Register;
