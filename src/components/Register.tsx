import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/login`,  // ahora será https://app.useunicorn.app/login
    data: { nombre: email.split('@')[0] }
  }
});

    if (error) {
      console.error('Error during sign up:', error.message);
      setErrorMsg(error.message);
    } else if (data.user) {
      setSuccessMsg('Usuario registrado. Revisa tu correo para confirmar.');
    } else {
      setErrorMsg('Ocurrió un error inesperado. Intenta nuevamente.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>Crear cuenta</h2>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <input
        type="password"
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <button onClick={handleRegister} style={{ width: '100%' }}>
        Registrarse
      </button>
      {errorMsg && <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green', marginTop: '1rem' }}>{successMsg}</p>}
    </div>
  );
};

export default Register;

