import './App.css';
import "bootstrap/dist/css/bootstrap.css";
import "./views/css/demo.css"


import { BrowserRouter } from 'react-router-dom';
//import { FullScreenLoaderProvider } from "./contexts/fullScreenLoader";
import { ToastsProvider } from "./contexts/toastContext";
import AppRouter from './routing/AppRouter';
import { AuthProvider } from './contexts/authContext';


export default function App() {
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastsProvider>
          {/* <FullScreenLoaderProvider> */}
            <AppRouter />
          {/* </FullScreenLoaderProvider> */}
        </ToastsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
