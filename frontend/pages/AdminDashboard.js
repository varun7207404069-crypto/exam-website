import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { useNavigate } from 'react-router-dom';

const html = htm.bind(React.createElement);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));

    useEffect(() => {
        fetchStats();
        const observer = new MutationObserver(() => {
            setIsDark(!document.body.classList.contains('light-theme'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return html`
            <div style=${{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#d3e4cd'}}>
                <h2 style=${{color: '#1b4332'}}>Loading Admin Platform...</h2>
            </div>
        `;
    }

    // Process data for metrics
    const totalStudents = stats?.total_students || 0;
    const totalExams = stats?.total_exams || 0;
    const liveSessions = stats?.recent_sessions?.filter(s => s.is_active)?.length || 0;
    const violationRate = stats?.total_exams ? Math.round(((stats?.recent_sessions?.filter(s => s.is_violated)?.length || 0) / stats.total_exams) * 100) : 0;
    
    const completedExams = stats?.recent_sessions?.filter(s => !s.is_active && !s.is_violated)?.length || 0;
    const avgScore = stats?.best_performers?.length > 0 ? 
        Math.round(stats.best_performers.reduce((acc, p) => acc + p.avg_percentage, 0) / stats.best_performers.length) : 0;

    const recentActivities = stats?.recent_sessions?.slice(0, 5) || [];
    const alerts = stats?.recent_sessions?.filter(s => s.is_violated) || [];


    const renderDashboard = () => html`
        <div className="velo-header">
            <div className="velo-title">Dashboard Overview</div>
            <div className="velo-search">
                <span>🔍</span>
                <input type="text" placeholder="Search Students or Exams..." />
            </div>
        </div>

        <div className="velo-grid">
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">📅</div>
                    Total Students
                </div>
                <div className="velo-card-value">${totalStudents}</div>
            </div>
            
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">⚡</div>
                    Total Exams
                </div>
                <div className="velo-card-value">${totalExams}</div>
            </div>
            
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">👥</div>
                    Live Sessions
                </div>
                <div className="velo-card-value">${liveSessions}</div>
            </div>
            
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">🏷️</div>
                    Violation Rate
                </div>
                <div className="velo-card-value">${violationRate}%</div>
            </div>
            
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">📅</div>
                    Completed Exams
                </div>
                <div className="velo-card-value">${completedExams < 10 ? '0' + completedExams : completedExams}</div>
            </div>
            
            <div className="velo-card">
                <div className="velo-card-header">
                    <div className="velo-card-icon">📄</div>
                    Avg. Score
                </div>
                <div className="velo-card-value">${avgScore}%</div>
            </div>
        </div>

        <div className="velo-lists-grid">
            <div className="velo-list-panel">
                <div className="velo-list-header">
                    <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>🕒</span> Recent Activities
                    </div>
                    <div style=${{cursor:'pointer', color:'#a0aec0'}}>⋮</div>
                </div>
                ${recentActivities.length === 0 ? html`<div style=${{color:'#a0aec0', padding:'20px'}}>No activities yet.</div>` : ''}
                ${recentActivities.map(activity => html`
                    <div className="velo-list-item" key=${activity.id}>
                        <div className=${`velo-list-icon ${activity.is_violated ? 'danger' : activity.is_active ? 'info' : ''}`}>
                            ${activity.is_violated ? '⚠️' : activity.is_active ? '⚡' : '🤝'}
                        </div>
                        <div>
                            <div style=${{fontSize:'0.95rem', color:'#4a5568'}}>
                                <strong style=${{color:'#2d3748'}}>${activity.user_id || 'Student'}</strong> 
                                ${activity.is_violated ? ' triggered a security violation in ' : activity.is_active ? ' started an exam in ' : ' completed an exam in '} 
                                ${activity.subject}
                            </div>
                            <div style=${{fontSize:'0.85rem', color:'#a0aec0', marginTop:'2px'}}>
                                ${activity.is_active ? 'today' : new Date(activity.start_time).toLocaleString()}
                            </div>
                        </div>
                    </div>
                `)}
            </div>
            
            <div className="velo-list-panel">
                <div className="velo-list-header">
                    <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>📋</span> Security Tasks
                    </div>
                    <div style=${{cursor:'pointer', color:'#4a5568', fontSize:'0.9rem'}} onClick=${() => setActiveTab('Tasks')}>+ View All</div>
                </div>
                ${alerts.slice(0,4).length === 0 ? html`<div style=${{color:'#a0aec0', padding:'20px'}}>No recent security alerts.</div>` : ''}
                ${alerts.slice(0,4).map(alert => html`
                    <div className="velo-task-item" key=${alert.id}>
                        <input type="checkbox" style=${{width: '18px', height: '18px', cursor: 'pointer', accentColor:'#1b4332'}} />
                        <div style=${{flex: 1}}>
                            <div style=${{fontSize:'0.95rem', color:'#2d3748'}}>Review violation for <strong>ID: ${alert.user_id}</strong></div>
                            <div style=${{fontSize:'0.85rem', color:'#718096'}}>${alert.violation_reason || 'Unauthorized activity detected'}</div>
                        </div>
                        <div style=${{color:'#ef4444', fontSize:'1.2rem'}}>🚩</div>
                    </div>
                `)}
            </div>
        </div>
    `;

    const renderStudents = () => html`
        <div className="velo-header">
            <div className="velo-title">Student Directory</div>
            <div className="velo-search">
                <span>🔍</span>
                <input type="text" placeholder="Search students..." />
            </div>
        </div>
        <div className="velo-lists-grid" style=${{gridTemplateColumns: '1fr 1fr'}}>
            <div className="velo-list-panel">
                <div className="velo-list-header">
                    <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>🏆</span> Top Performers
                    </div>
                </div>
                ${stats?.best_performers?.map(p => html`
                    <div className="velo-list-item">
                        <div className="velo-list-icon info">👤</div>
                        <div style=${{flex: 1}}>
                            <div style=${{fontWeight: '600', color: '#2d3748'}}>${p.user_name || p.user_id}</div>
                            <div style=${{fontSize: '0.85rem', color: '#718096'}}>${p.exams} Exams Completed</div>
                        </div>
                        <div style=${{fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem'}}>${p.avg_percentage}%</div>
                    </div>
                `)}
            </div>
            <div className="velo-list-panel">
                <div className="velo-list-header">
                    <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>⚠️</span> Needs Attention
                    </div>
                </div>
                ${stats?.least_performers?.map(p => html`
                    <div className="velo-list-item">
                        <div className="velo-list-icon danger">👤</div>
                        <div style=${{flex: 1}}>
                            <div style=${{fontWeight: '600', color: '#2d3748'}}>${p.user_name || p.user_id}</div>
                            <div style=${{fontSize: '0.85rem', color: '#718096'}}>${p.exams} Exams Completed</div>
                        </div>
                        <div style=${{fontWeight: 'bold', color: '#ef4444', fontSize: '1.1rem'}}>${p.avg_percentage}%</div>
                    </div>
                `)}
            </div>
        </div>
    `;

    const renderTasks = () => html`
        <div className="velo-header">
            <div className="velo-title">Security & Action Tasks</div>
        </div>
        <div className="velo-list-panel" style=${{minHeight: '600px'}}>
            <div className="velo-list-header">
                <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span>📋</span> All Outstanding Security Tasks
                </div>
            </div>
            ${alerts.length === 0 ? html`<div style=${{color:'#a0aec0', padding:'20px', textAlign:'center', marginTop:'40px'}}>🎉 No outstanding security tasks!</div>` : ''}
            ${alerts.map(alert => html`
                <div className="velo-task-item" key=${alert.id}>
                    <input type="checkbox" style=${{width: '20px', height: '20px', cursor: 'pointer', accentColor:'#1b4332'}} />
                    <div style=${{flex: 1}}>
                        <div style=${{fontSize:'1.05rem', color:'#2d3748', marginBottom: '4px'}}>Review violation for <strong>${alert.user_name || alert.user_id}</strong> in ${alert.subject}</div>
                        <div style=${{fontSize:'0.9rem', color:'#718096'}}>${alert.violation_reason || 'Unauthorized activity detected'}</div>
                        <div style=${{fontSize:'0.8rem', color:'#a0aec0', marginTop: '6px'}}>${new Date(alert.start_time).toLocaleString()}</div>
                    </div>
                    <div style=${{color:'#ef4444', fontSize:'1.5rem', cursor:'pointer'}}>🚩</div>
                </div>
            `)}
        </div>
    `;

    const renderReports = () => html`
        <div className="velo-header">
            <div className="velo-title">Exam Session Reports</div>
            <div className="velo-search">
                <span>🔍</span>
                <input type="text" placeholder="Filter reports..." value=${searchTerm} onChange=${e => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="velo-list-panel" style=${{overflowX: 'auto'}}>
            <table className="velo-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats?.recent_sessions?.filter(s => (s.user_name || s.user_id).toLowerCase().includes(searchTerm.toLowerCase()) || s.subject.toLowerCase().includes(searchTerm.toLowerCase())).map(session => html`
                        <tr key=${session.id}>
                            <td style=${{fontWeight: '600', color: '#2d3748'}}>${session.user_name || session.user_id}</td>
                            <td style=${{color: '#4a5568'}}>${session.subject}</td>
                            <td style=${{fontWeight: 'bold', color: '#064e3b'}}>${session.score} / ${session.total}</td>
                            <td style=${{color: '#4a5568'}}>
                                ${(() => {
                                    const start = new Date(session.start_time);
                                    const end = session.end_time ? new Date(session.end_time) : null;
                                    if (!end) return 'Live';
                                    const diff = Math.floor((end - start) / 1000);
                                    const mins = Math.floor(diff / 60);
                                    const secs = diff % 60;
                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                })()}
                            </td>
                            <td>
                                ${session.is_active ? html`<span className="badge badge-info">● Live</span>` : 
                                  session.is_violated ? html`<span className="badge badge-danger">⚠️ Disqualified</span>` : 
                                  html`<span className="badge badge-success">✓ Completed</span>`}
                            </td>
                            <td style=${{color: '#718096', fontSize: '0.9rem'}}>${new Date(session.start_time).toLocaleString()}</td>
                        </tr>
                    `)}
                </tbody>
            </table>
        </div>
    `;

    const renderPlaceholder = (title, icon) => html`
        <div className="velo-header">
            <div className="velo-title">${title} Overview</div>
        </div>
        <div style=${{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', textAlign: 'center'}}>
            <div style=${{fontSize: '5rem', marginBottom: '1rem', opacity: 0.8}}>${icon}</div>
            <h2 style=${{color: '#2d3748', marginBottom: '1rem'}}>The ${title} Module is coming soon!</h2>
            <p style=${{color: '#718096', maxWidth: '400px', lineHeight: 1.6}}>
                This feature is currently under development. It will provide comprehensive tools for managing your ${title.toLowerCase()} in a future update.
            </p>
            <button className="velo-btn-primary" style=${{marginTop: '2rem', background: '#1b4332', color: '#fff'}} onClick=${() => setActiveTab('Dashboard')}>
                Return to Dashboard
            </button>
        </div>
    `;

    return html`
        <div className="velo-dashboard">
            <style>
                ${`
                .velo-dashboard {
                    display: flex;
                    height: 100vh;
                    background: linear-gradient(135deg, #8ba888 0%, #bac9b5 100%);
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #2d3748;
                    overflow: hidden;
                    padding: 20px;
                }
                .velo-container {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    background: #fdfdfc;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                }
                .velo-sidebar {
                    width: 280px;
                    background: #fdfdfc;
                    border-right: 1px solid #f0f0f0;
                    display: flex;
                    flex-direction: column;
                    padding: 24px 20px;
                    overflow-y: auto;
                }
                .velo-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #1a202c;
                    margin-bottom: 24px;
                    padding: 0 8px;
                    letter-spacing: -0.05em;
                }
                .velo-logo-icon {
                    background: #104c21;
                    color: #a3e635;
                    border-radius: 8px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                }
                .velo-btn-outline {
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    padding: 12px 16px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 0.95rem;
                    color: #4a5568;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .velo-btn-primary {
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    padding: 12px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 24px;
                    font-size: 0.95rem;
                    color: #4a5568;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    transition: transform 0.1s;
                }
                .velo-btn-primary:active {
                    transform: scale(0.98);
                }
                .velo-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .velo-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #4a5568;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .velo-nav-item:hover {
                    background: #f7fafc;
                }
                .velo-nav-item.active {
                    background: #1b4332;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(27,67,50,0.2);
                }
                .velo-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px 40px;
                    overflow-y: auto;
                    background: #fafbfa;
                }
                .velo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .velo-title {
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #4a5568;
                }
                .velo-search {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 10px 16px;
                    border-radius: 24px;
                    width: 320px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #a0aec0;
                }
                .velo-search input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 0.9rem;
                    background: transparent;
                }
                .velo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .velo-card {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    position: relative;
                    border: 1px solid #f0f0f0;
                    overflow: hidden;
                }
                .velo-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 80% 80%, rgba(134, 239, 172, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 20% 20%, rgba(190, 242, 100, 0.05) 0%, transparent 40%);
                    pointer-events: none;
                }
                .velo-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #718096;
                    font-size: 1.05rem;
                    margin-bottom: 12px;
                }
                .velo-card-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f7fafc;
                    border: 1px solid #edf2f7;
                    font-size: 1.1rem;
                }
                .velo-card-value {
                    font-size: 2.8rem;
                    font-weight: 700;
                    color: #064e3b;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                
                /* Layout for Lists */
                .velo-lists-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .velo-list-panel {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    border: 1px solid #f0f0f0;
                }
                .velo-list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    font-size: 1.2rem;
                    font-weight: 500;
                    color: #4a5568;
                }
                .velo-list-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    background: #ffffff;
                }
                .velo-list-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #f0fdf4;
                    color: #22c55e;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                }
                .velo-list-icon.danger {
                    background: #fef2f2;
                    color: #ef4444;
                }
                .velo-list-icon.info {
                    background: #eff6ff;
                    color: #3b82f6;
                }
                .velo-task-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                    margin-bottom: 12px;
                }
                
                /* Table Styles for Reports */
                .velo-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .velo-table th {
                    text-align: left;
                    padding: 12px 16px;
                    color: #a0aec0;
                    font-weight: 500;
                    font-size: 0.9rem;
                    border-bottom: 2px solid #edf2f7;
                }
                .velo-table td {
                    padding: 16px;
                    border-bottom: 1px solid #edf2f7;
                    vertical-align: middle;
                }
                .velo-table tr:hover td {
                    background: #f8fafc;
                }
                .badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: inline-block;
                }
                .badge-info { background: #eff6ff; color: #3b82f6; }
                .badge-danger { background: #fef2f2; color: #ef4444; }
                .badge-success { background: #f0fdf4; color: #22c55e; }

                /* ── Dark Mode Overrides ── */
                body:not(.light-theme) .velo-dashboard {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }
                body:not(.light-theme) .velo-container {
                    background: #1e293b;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                body:not(.light-theme) .velo-sidebar {
                    background: #1e293b;
                    border-right: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-logo {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .velo-btn-outline {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-nav-item {
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-nav-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: #f1f5f9;
                }
                body:not(.light-theme) .velo-main {
                    background: #0f172a;
                }
                body:not(.light-theme) .velo-title {
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-search {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-search input {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .velo-card {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-card-header {
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-card-icon {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                body:not(.light-theme) .velo-card-value {
                    color: #86efac;
                }
                body:not(.light-theme) .velo-list-panel {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-list-header {
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-list-item {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-task-item {
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-table th {
                    color: #475569;
                    border-bottom: 2px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .velo-table td {
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    color: #94a3b8;
                }
                body:not(.light-theme) .velo-table tr:hover td {
                    background: rgba(255,255,255,0.03);
                }
                body:not(.light-theme) .badge-info { background: rgba(59,130,246,0.15); }
                body:not(.light-theme) .badge-danger { background: rgba(239,68,68,0.15); }
                body:not(.light-theme) .badge-success { background: rgba(34,197,94,0.15); }
                `}
            </style>

            <div className="velo-container">
                <div className="velo-sidebar">
                    <div className="velo-logo">
                        <div className="velo-logo-icon">v</div>
                        velo
                    </div>
                    
                    <div className="velo-btn-outline" onClick=${() => navigate('/')}>
                        <span>💡 Onboarding</span>
                        <span style=${{color:'#a0aec0', fontSize:'1.2rem'}}>×</span>
                    </div>
                    

                    
                    <div className="velo-nav">
                        <div className=${`velo-nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick=${() => setActiveTab('Dashboard')}>
                            <span>⊞</span> Dashboard
                        </div>
                        <div className=${`velo-nav-item ${activeTab === 'Students' ? 'active' : ''}`} onClick=${() => setActiveTab('Students')}>
                            <span>👥</span> Students
                        </div>
                        <div className=${`velo-nav-item ${activeTab === 'Tasks' ? 'active' : ''}`} onClick=${() => setActiveTab('Tasks')}>
                            <span>📋</span> Tasks
                        </div>
                        <div className=${`velo-nav-item ${activeTab === 'Reports' ? 'active' : ''}`} onClick=${() => setActiveTab('Reports')}>
                            <span>📊</span> Reports
                        </div>
                    </div>
                </div>

                <div className="velo-main animate-fade" key=${activeTab}>
                    ${activeTab === 'Dashboard' && renderDashboard()}
                    ${activeTab === 'Students' && renderStudents()}
                    ${activeTab === 'Tasks' && renderTasks()}
                    ${activeTab === 'Reports' && renderReports()}
                </div>
            </div>
        </div>
    `;
};

export default AdminDashboard;
