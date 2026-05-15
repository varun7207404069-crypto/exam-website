import React, { useState } from 'react';
import htm from 'htm';
import { Link, useNavigate } from 'react-router-dom';

const html = htm.bind(React.createElement);

const LoginPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields.'); return; }
        
        try {
            const resp = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.detail || 'Login failed');
            }
            
            const userData = await resp.json();
            onLogin(userData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return html`
        <div className="container flex-center animate-fade" style=${{paddingTop: '100px'}}>
            <div className="card" style=${{width: '100%', maxWidth: '400px'}}>
                <h2 style=${{marginBottom: '24px', textAlign: 'center'}}>Login to AI Platform</h2>
                ${error && html`<div style=${{color: '#ef4444', background: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem'}}>${error}</div>`}
                <form onSubmit=${handleSubmit} style=${{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div style=${{display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left'}}>
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            className="btn btn-outline" 
                            style=${{textAlign: 'left', cursor: 'text'}} 
                            value=${email} 
                            onChange=${(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div style=${{display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left'}}>
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="btn btn-outline" 
                            style=${{textAlign: 'left', cursor: 'text'}} 
                            value=${password} 
                            onChange=${(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style=${{marginTop: '8px'}}>
                        Login
                    </button>
                </form>
                <p style=${{marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                    Don't have an account? <${Link} to="/signup" style=${{color: 'var(--primary-accent)', fontWeight: '600'}}>Sign Up</${Link}>
                </p>
            </div>
        </div>
    `;
};

export default LoginPage;
