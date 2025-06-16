import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RoutesStructure from "./Routes/RoutesStructure";
import { AuthProvider } from "./Context/AuthContext";
// import './styles/globals.css';

const router = createBrowserRouter(RoutesStructure);

//-> App este aplicatia care folosete un AuthProvider care imbraca aplicatia si ofera contextul de autentificare(loggedIn, userId, token, etc); RouterProvider primeste router-ul cu toate rutele definite, rute care pot accesa informatiile din AuthProvider cand au nevoie
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;