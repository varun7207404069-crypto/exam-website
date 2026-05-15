import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import htm from 'htm';
import LandingPage from './pages/LandingPage.js';
import Dashboard from './pages/Dashboard.js';
import QuestionPage from './pages/QuestionPage.js';
import LoginPage from './pages/LoginPage.js';
import SignUpPage from './pages/SignUpPage.js';
import AdminDashboard from './pages/AdminDashboard.js';

const html = htm.bind(React.createElement);

// Guard: redirect to /login if not authenticated
const ProtectedRoute = ({ isLoggedIn, children }) => {
    if (!isLoggedIn) return html`<${Navigate} to="/login" replace />`;
    return children;
};

const App = () => {
    const [isLight, setIsLight] = useState(localStorage.getItem('theme') === 'light');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));

    useEffect(() => {
        document.body.classList.toggle('light-theme', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }, [isLight]);

    const toggleTheme = () => setIsLight(prev => !prev);

    const handleLogin = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
    };

    return html`
        <${BrowserRouter}>
            <nav>
                <${Link} to="/" className="logo">AI Platform</${Link}>
                <div className="nav-links">
                    <a href="/#features">Features</a>
                    <a href="/#subjects">Subjects</a>
                    <div className="nav-auth">
                        ${isLoggedIn
            ? html`
                                <${Link} to="/dashboard" className="nav-link">Dashboard</${Link}>
                        <${Link} to="/admin" className="nav-link" style=${{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>Admin</${Link}>
                        <button className="btn btn-primary" onClick=${handleLogout}>Logout</button>`
            : html`
                                <${Link} to="/login"  className="btn btn-outline" style=${{ padding: '8px 20px' }}>Login</${Link}>
                                <${Link} to="/signup" className="btn btn-primary" style=${{ padding: '8px 20px' }}>Sign Up</${Link}>`
        }
                    </div>
                    <button className="theme-toggle" onClick=${toggleTheme} title="Toggle theme">
                        ${isLight ? '🌙' : '☀️'}
                    </button>
                </div>
            </nav>

            <div className="app-content">
                <${Routes}>
                    <${Route} path="/"       element=${html`<${LandingPage} />`} />
                    <${Route} path="/login"  element=${html`<${LoginPage}  onLogin=${handleLogin} />`} />
                    <${Route} path="/signup" element=${html`<${SignUpPage} onLogin=${handleLogin} />`} />
                    <${Route} path="/dashboard" element=${html`
                        <${ProtectedRoute} isLoggedIn=${isLoggedIn}>
                            <${Dashboard} />
                        </${ProtectedRoute}>`} />
                    <${Route} path="/question/:subject" element=${html`
                        <${ProtectedRoute} isLoggedIn=${isLoggedIn}>
                            <${QuestionPage} />
                        </${ProtectedRoute}>`} />
                    <${Route} path="/admin" element=${html`
                        <${ProtectedRoute} isLoggedIn=${isLoggedIn}>
                            <${AdminDashboard} />
                        </${ProtectedRoute}>`} />
                </${Routes}>
            </div>
        </${BrowserRouter}>
    `;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
