import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { supabase } from "../supabaseClient";

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

        // 2. Obtener datos del usuario incluyendo client_id
        const { data: userDataFromDB, error } = await supabase
          .from('users')
          .select('id, email, client_id')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("❌ Error al cargar usuario:", error.message);
        } else {
          // 3. Guardar client_id en localStorage (CRÍTICO para multiusuario)
          if (userDataFromDB?.client_id) {
            localStorage.setItem('unicorn_client_id', userDataFromDB.client_id);
            console.log('✅ client_id guardado en localStorage:', userDataFromDB.client_id);
          }
          
          localStorage.setItem('unicorn_user_id', userDataFromDB.id);
          localStorage.setItem('unicorn_user', JSON.stringify(userDataFromDB));
          
          setUserData(userDataFromDB);
          console.log("✅ Datos del usuario cargados:", userDataFromDB);
        }

        // 4. También llamar a get_user_data si necesitas datos adicionales
        const { data: rpcData } = await supabase.rpc("get_user_data");
        if (rpcData && rpcData[0]) {
          setUserData((prev: any) => ({ ...prev, ...rpcData[0] }));
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
    <AuthContext.Provider
      value={{
        userData,
        refetch: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: userDataFromDB } = await supabase
              .from('users')
              .select('id, email, client_id')
              .eq('id', session.user.id)
              .single();
            
            if (userDataFromDB?.client_id) {
              localStorage.setItem('unicorn_client_id', userDataFromDB.client_id);
            }
            
            const { data: rpcData } = await supabase.rpc("get_user_data");
            setUserData({ ...userDataFromDB, ...rpcData?.[0] });
          }
        },
        logout: async () => {
          try {
            // 1. Cerrar sesión en Supabase
            await supabase.auth.signOut();
            
            // 2. Limpiar localStorage
            localStorage.removeItem('unicorn_client_id');
            localStorage.removeItem('unicorn_user_id');
            localStorage.removeItem('unicorn_user');
            localStorage.removeItem('unicorn_leads');
            localStorage.removeItem('unicorn_campaigns');
            localStorage.removeItem('unicorn_conversations');
            
            // 3. Resetear estado
            setUserData(null);
            setIsAuthorized(false);
            
            console.log('✅ Sesión cerrada correctamente');
          } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Contexto para que toda la app acceda a userData
export const AuthContext = React.createContext<{
  userData: any;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  userData: null,
  refetch: async () => {},
  logout: async () => {},
});

export default AuthGuard;
