import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { supabase } from "../supabaseClient"; // 👈 asegúrate de tenerlo configurado

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Verificar si hay sesión activa
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setIsAuthorized(false);
          setAuthChecked(true);
          return;
        }

        setIsAuthorized(true);

        // 2. Llamar RPC para traer los datos del usuario y cliente
        const { data, error } = await supabase.rpc("get_user_data");

        if (error) {
          console.error("❌ Error al cargar datos del usuario:", error.message);
        } else {
          setUserData(data?.[0] || null);
          console.log("✅ Datos del usuario cargados:", data?.[0]);
        }
      } catch (err) {
        console.error("❌ Error en checkAuth:", err);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Mientras verifica auth → mostrar loading
  if (!authChecked) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si no está logueado → redirigir a login
  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está logueado → pasar datos del usuario al resto de la app
  return (
    <AuthContext.Provider value={{ userData, refetch: async () => {
      const { data } = await supabase.rpc("get_user_data");
      setUserData(data?.[0] || null);
    } }}>
      {children}
    </AuthContext.Provider>
  );
};

// Contexto para que toda la app acceda a userData
export const AuthContext = React.createContext<{
  userData: any;
  refetch: () => Promise<void>;
}>({
  userData: null,
  refetch: async () => {},
});

export default AuthGuard;
