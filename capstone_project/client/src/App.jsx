import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import Room from './pages/Room';
import Login from './pages/Login';
import Register from './pages/Register';
// ENSURE THIS IMPORT MATCHES THE FILENAME FROM STEP 3
import { AuthProvider } from './context/AuthProvider'; 
import LoginSuccess from './pages/LoginSuccess';
import './App.css';

function App() {
  return (
    <AuthProvider>
        <Router>
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/room/:roomId" element={<Room />} />
                <Route path="/auth/success" element={<LoginSuccess />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;