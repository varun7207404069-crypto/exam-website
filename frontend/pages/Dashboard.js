import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { useNavigate } from 'react-router-dom';

const html = htm.bind(React.createElement);

export const SUBJECTS = [
    // ── Year I – Semester I ──
    { name: 'Linear Algebra & Ordinary Differential Equations', icon: '📐', tag: 'Year I', noProgramming: true },
    { name: 'Semiconductor Physics & Electromagnetics',         icon: '🔬', tag: 'Year I', noProgramming: true },
    { name: 'Electrical & Electronics Engineering',             icon: '⚡', tag: 'Year I', noProgramming: true },
    { name: 'Engineering Chemistry',                            icon: '🧪', tag: 'Year I', noProgramming: true },
    { name: 'Python Programming',                               icon: '🐍', tag: 'Year I' },
    { name: 'Problem Solving through Programming - I',          icon: '💻', tag: 'Year I' },
    { name: 'English Proficiency & Communication Skills',       icon: '🗣️', tag: 'Year I', noProgramming: true },
    { name: 'Constitution of India',                            icon: '📜', tag: 'Year I', noProgramming: true },

    // ── Year I – Semester II ──
    { name: 'Algebra',                                          icon: '➗', tag: 'Year I', noProgramming: true },
    { name: 'Discrete Mathematical Structures',                 icon: '🔢', tag: 'Year I', noProgramming: true },
    { name: 'Engineering Graphics',                             icon: '📏', tag: 'Year I', noProgramming: true },
    { name: 'C Programming',                                    icon: '⌨️', tag: 'Year I' },
    { name: 'Problem Solving through Programming - II',         icon: '🖥️', tag: 'Year I' },
    { name: 'Technical English Communication',                  icon: '📝', tag: 'Year I', noProgramming: true },
    { name: 'Numerical Methods',                                icon: '📊', tag: 'Year I', noProgramming: true },

    // ── Year II – Semester I ──
    { name: 'Probability & Statistics',                         icon: '📉', tag: 'Year II', noProgramming: true },
    { name: 'Data Structures',                                  icon: '🌳', tag: 'Year II' },
    { name: 'Management Science',                               icon: '📋', tag: 'Year II', noProgramming: true },
    { name: 'Database Management Systems',                      icon: '🗄️', tag: 'Year II' },
    { name: 'Digital Logic Design',                             icon: '🔌', tag: 'Year II', noProgramming: true },
    { name: 'OOPs through JAVA',                                icon: '☕', tag: 'Year II' },
    { name: 'Environmental Studies',                            icon: '🌿', tag: 'Year II', noProgramming: true },

    // ── Year II – Semester II ──
    { name: 'Advanced Coding Consistency',                      icon: '⚙️', tag: 'Year II' },
    { name: 'Professional Communication',                       icon: '💬', tag: 'Year II', noProgramming: true },
    { name: 'Computer Organisation & Architecture',             icon: '💾', tag: 'Year II', noProgramming: true },
    { name: 'Design & Analysis of Algorithms',                  icon: '🔍', tag: 'Year II' },
    { name: 'Operating Systems',                                icon: '🖱️', tag: 'Year II', noProgramming: true },
    { name: 'Theory of Computation',                            icon: '🔄', tag: 'Year II', noProgramming: true },

    // ── Year III – Semester I ──
    { name: 'Soft Skills Laboratory',                           icon: '🤝', tag: 'Year III', noProgramming: true },
    { name: 'Introduction to Artificial Intelligence',          icon: '🧠', tag: 'Year III', noProgramming: true },
    { name: 'Compiler Design',                                  icon: '🔧', tag: 'Year III', noProgramming: true },
    { name: 'Web Technologies',                                 icon: '🕸️', tag: 'Year III' },
    { name: 'Mini Project - Phase I',                           icon: '🛠️', tag: 'Year III', noProgramming: true },

    // ── Year III – Semester II ──
    { name: 'Quantitative Aptitude & Logical Reasoning',        icon: '🧮', tag: 'Year III', noProgramming: true },
    { name: 'Computer Networks',                                icon: '🌐', tag: 'Year III', noProgramming: true },
    { name: 'Data Mining & Intelligence',                       icon: '⛏️', tag: 'Year III', noProgramming: true },
    { name: 'Software Engineering',                             icon: '🏗️', tag: 'Year III', noProgramming: true },
    { name: 'Mini Project - Phase II',                          icon: '🚀', tag: 'Year III', noProgramming: true },

    // ── Year IV – Semester I ──
    { name: 'Cryptography & Network Security',                  icon: '🔐', tag: 'Year IV', noProgramming: true },
    { name: 'Big Data Analytics',                               icon: '📦', tag: 'Year IV', noProgramming: true },
    { name: 'Cloud Computing',                                  icon: '☁️', tag: 'Year IV', noProgramming: true },

    // ── Year IV – Semester II ──
    { name: 'Project Work',                                     icon: '🎓', tag: 'Year IV', noProgramming: true },

    // ── Department Electives ──
    { name: 'Advanced Data Structures',                         icon: '🌲', tag: 'Electives' },
    { name: 'Advanced JAVA Programming',                        icon: '♨️', tag: 'Electives' },
    { name: 'Computer Graphics',                                icon: '🎨', tag: 'Electives', noProgramming: true },
    { name: 'Deep Learning',                                    icon: '🤖', tag: 'Electives', noProgramming: true },
    { name: 'Digital Forensics',                                icon: '🔎', tag: 'Electives', noProgramming: true },
    { name: 'Digital Image Processing',                         icon: '🖼️', tag: 'Electives', noProgramming: true },
    { name: 'Web & Database Security',                          icon: '🛡️', tag: 'Electives', noProgramming: true },
    { name: 'Machine Learning',                                 icon: '⚙️', tag: 'Electives', noProgramming: true },
    { name: 'Mobile Ad-hoc Networks',                           icon: '📡', tag: 'Electives', noProgramming: true },
    { name: 'Mobile Application Development',                   icon: '📱', tag: 'Electives', noProgramming: true },
    { name: 'Text Mining',                                      icon: '🔤', tag: 'Electives', noProgramming: true },
    { name: 'Numerical Algorithms',                             icon: '🔢', tag: 'Electives', noProgramming: true },
    { name: 'Operating System Design',                          icon: '🖥️', tag: 'Electives', noProgramming: true },
    { name: 'Optimization Techniques',                          icon: '📈', tag: 'Electives', noProgramming: true },
    { name: 'Intrusion Detection & Prevention Systems',         icon: '🚨', tag: 'Electives', noProgramming: true },
    { name: 'Simulation & Modelling',                           icon: '🔭', tag: 'Electives', noProgramming: true },

    // ── Honours for CSE ──
    { name: 'Advanced Graph Algorithms',                        icon: '🕸️', tag: 'Honours', noProgramming: true },
    { name: 'Blockchain',                                       icon: '⛓️', tag: 'Honours', noProgramming: true },
    { name: 'Parallel & Distributed Computing',                 icon: '⚡', tag: 'Honours', noProgramming: true },
    { name: 'Internet of Things',                               icon: '📟', tag: 'Honours', noProgramming: true },
    { name: 'Wireless Sensor Networks',                         icon: '📶', tag: 'Honours', noProgramming: true },
    { name: 'Capstone Project',                                 icon: '🏆', tag: 'Honours', noProgramming: true },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedMode, setSelectedMode] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [stats, setStats] = useState([]);
    const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));

    useEffect(() => {
        const statsStr = localStorage.getItem('studentStats');
        if (statsStr) {
            setStats(JSON.parse(statsStr));
        }

        // Watch for theme changes
        const observer = new MutationObserver(() => {
            setIsDark(!document.body.classList.contains('light-theme'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const categories = [...new Set(SUBJECTS.map(s => s.tag))];

    const startMode = (mode) => {
        if (!selectedSubject) return;
        setSelectedMode(mode);
        setShowInstructions(true);
    };

    const initiateExam = () => {
        if (!hasAgreed) return;
        navigate(`/question/${encodeURIComponent(selectedSubject.name)}?mode=${selectedMode}`);
        setSelectedSubject(null);
        setSelectedMode(null);
        setShowInstructions(false);
        setHasAgreed(false);
    };

    const renderDashboardView = () => {
        const validStats = Array.isArray(stats) ? stats : [];
        const completedExams = validStats.filter(s => !s.violation).length;
        const violations = validStats.filter(s => s.violation).length;
        const avgScore = validStats.length > 0 ? Math.round(validStats.reduce((acc, curr) => acc + curr.score, 0) / validStats.length) : 0;
        const activeHours = validStats.length * 1.5; // Dummy calculation

        return html`
            <div className="stu-main-content animate-fade">
                <div className="stu-overview-header">
                    <h2 style=${{fontSize: '1.2rem', color: 'var(--text-primary)'}}>Overview</h2>
                </div>
                
                <div className="stu-cards-row">
                    <div className="stu-stat-card">
                        <div className="stu-stat-icon" style=${{background: '#fee2e2', color: '#ef4444'}}>📚</div>
                        <div className="stu-stat-text">Exams Taken</div>
                        <div className="stu-stat-val">${stats.length}</div>
                    </div>
                    <div className="stu-stat-card">
                        <div className="stu-stat-icon" style=${{background: '#dcfce7', color: '#22c55e'}}>✅</div>
                        <div className="stu-stat-text">Exams Completed</div>
                        <div className="stu-stat-val">${completedExams}</div>
                    </div>
                    <div className="stu-stat-card">
                        <div className="stu-stat-icon" style=${{background: '#e0e7ff', color: '#3b82f6'}}>📈</div>
                        <div className="stu-stat-text">Avg. Score</div>
                        <div className="stu-stat-val">${avgScore}%</div>
                    </div>
                    <div className="stu-stat-card">
                        <div className="stu-stat-icon" style=${{background: '#f3e8ff', color: '#a855f7'}}>🏆</div>
                        <div className="stu-stat-text">Certificates</div>
                        <div className="stu-stat-val">${Math.floor(completedExams / 3)}</div>
                    </div>
                </div>

                <div className="stu-charts-row">
                    <div className="stu-chart-card" style=${{flex: 1.5}}>
                        <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                            <h3 style=${{fontSize: '1rem', color: 'var(--text-primary)'}}>Actively Hours</h3>
                            <span style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Weekly ▾</span>
                        </div>
                        <div className="stu-bar-chart">
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '40%'}}></div>
                                <span className="stu-bar-label">M</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '70%'}}></div>
                                <span className="stu-bar-label">T</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '50%'}}></div>
                                <span className="stu-bar-label">W</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '90%'}}></div>
                                <span className="stu-bar-label">T</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '60%'}}></div>
                                <span className="stu-bar-label">F</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '30%', background: '#e2e8f0'}}></div>
                                <span className="stu-bar-label">S</span>
                            </div>
                            <div className="stu-bar-group">
                                <div className="stu-bar" style=${{height: '20%', background: '#e2e8f0'}}></div>
                                <span className="stu-bar-label">S</span>
                            </div>
                            
                            <div className="stu-chart-stats" style=${{marginLeft: '20px'}}>
                                <div style=${{marginBottom: '15px'}}>
                                    <div style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Time spent</div>
                                    <div style=${{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>28 <span style=${{fontSize:'0.8rem', color:'#22c55e'}}>85%</span></div>
                                </div>
                                <div>
                                    <div style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Exams passed</div>
                                    <div style=${{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>${completedExams} <span style=${{fontSize:'0.8rem', color:'#22c55e'}}>100%</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="stu-chart-card" style=${{flex: 1}}>
                        <div style=${{marginBottom: '20px'}}>
                            <h3 style=${{fontSize: '1rem', color: 'var(--text-primary)'}}>Performance</h3>
                        </div>
                        <div style=${{height: '100px', width: '100%', position: 'relative'}}>
                            <svg viewBox="0 0 100 50" style=${{width: '100%', height: '100%', overflow: 'visible'}}>
                                <path d="M0,40 Q10,20 20,30 T40,10 T60,25 T80,5 T100,20" fill="none" stroke="#4f46e5" strokeWidth="2" />
                                <circle cx="80" cy="5" r="3" fill="#4f46e5" />
                                <path d="M0,45 Q20,35 40,40 T80,30 T100,35" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                            </svg>
                        </div>
                        <div style=${{display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '10px'}}>
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                        <div style=${{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span style=${{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>40%</span>
                            <span style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Your productivity is 40% higher compared to last month.</span>
                        </div>
                    </div>
                </div>

                <div className="stu-assignments">
                    <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                        <h3 style=${{fontSize: '1rem', color: 'var(--text-primary)'}}>Recent Exams</h3>
                        <span style=${{fontSize: '0.8rem', color: '#4f46e5', cursor: 'pointer'}} onClick=${() => setActiveTab('Subjects')}>Take New Exam →</span>
                    </div>
                    
                    <div className="stu-assignment-list">
                        <div className="stu-list-header">
                            <div style=${{flex: 2}}>SUBJECT</div>
                            <div style=${{flex: 1}}>SCORE</div>
                            <div style=${{flex: 1, textAlign: 'right'}}>STATUS</div>
                        </div>
                        
                        ${stats.length === 0 ? html`<div style=${{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>No exams taken yet.</div>` : ''}
                        
                        ${stats.slice(0, 4).map((stat, idx) => html`
                            <div className="stu-list-row" key=${idx}>
                                <div style=${{flex: 2, display: 'flex', alignItems: 'center', gap: '15px'}}>
                                    <div className="stu-list-icon">📝</div>
                                    <div>
                                        <div style=${{fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem'}}>${stat.subject}</div>
                                        <div style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>${stat.date}</div>
                                    </div>
                                </div>
                                <div style=${{flex: 1, fontWeight: '600', color: 'var(--text-primary)'}}>
                                    ${stat.score} <span style=${{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>/ ${stat.total}</span>
                                </div>
                                <div style=${{flex: 1, textAlign: 'right'}}>
                                    ${stat.violation ? html`
                                        <span className="stu-badge stu-badge-danger">Disqualified</span>
                                    ` : html`
                                        <span className="stu-badge stu-badge-success">Completed</span>
                                    `}
                                </div>
                            </div>
                        `)}
                    </div>
                </div>
            </div>
        `;
    };

    const renderSubjectsView = () => html`
        <div className="stu-main-content animate-fade">
            <div className="stu-overview-header" style=${{marginBottom: '20px'}}>
                <div>
                    <h2 style=${{fontSize: '1.5rem', color: 'var(--text-primary)'}}>Select a Subject</h2>
                    <p style=${{color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '5px'}}>Choose a topic to begin your assessment.</p>
                </div>
            </div>
            
            <div style=${{maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: '10px'}}>
                ${categories.map(cat => html`
                    <div key=${cat} style=${{marginBottom: '30px'}}>
                        <div style=${{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px'}}>
                            <h3 style=${{fontSize: '1rem', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700'}}>${cat}</h3>
                            <div style=${{flex: 1, height: '1px', background: '#e2e8f0'}}></div>
                        </div>
                        <div style=${{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px'}}>
                            ${SUBJECTS.filter(s => s.tag === cat).map(subject => html`
                                <div 
                                    key=${subject.name} 
                                    className="stu-subject-card" 
                                    onClick=${() => setSelectedSubject(subject)}
                                >
                                    <div style=${{fontSize: '2rem', marginBottom: '10px'}}>${subject.icon}</div>
                                    <h3 style=${{marginBottom: '8px', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '1.3'}}>${subject.name}</h3>
                                    <div className="stu-btn-outline" style=${{marginTop: 'auto', textAlign: 'center'}}>
                                        Start Exam →
                                    </div>
                                </div>
                            `)}
                        </div>
                    </div>
                `)}
            </div>
        </div>
    `;

    const renderPlaceholder = (title) => html`
        <div className="stu-main-content animate-fade" style=${{alignItems: 'center', justifyContent: 'center'}}>
            <div style=${{textAlign: 'center', padding: '60px', color: 'var(--text-secondary)'}}>
                <div style=${{fontSize: '4rem', marginBottom: '20px'}}>🚀</div>
                <h2 style=${{color: 'var(--text-primary)', marginBottom: '10px'}}>The ${title} Module is coming soon!</h2>
                <p style=${{maxWidth: '400px', lineHeight: '1.6'}}>We are working hard to bring you this feature. Check back in the next update.</p>
            </div>
        </div>
    `;

    return html`
        <div className="stu-layout">
            <style>
                ${`
                .stu-layout {
                    display: flex;
                    height: 100vh;
                    background: #f1f5f9; /* Outer background, slightly darker than main */
                    font-family: 'Inter', system-ui, sans-serif;
                    overflow: hidden;
                    padding: 16px;
                }
                
                /* Sidebar */
                .stu-sidebar {
                    width: 250px;
                    background: #1e1b4b; /* Deep dark blue/purple */
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    padding: 30px 20px;
                    color: #fff;
                    margin-right: 16px;
                }
                .stu-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-bottom: 40px;
                    padding-left: 10px;
                }
                .stu-logo-icon {
                    width: 32px;
                    height: 32px;
                    background: #6366f1;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stu-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                }
                .stu-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #a5b4fc;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .stu-nav-item:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.05);
                }
                .stu-nav-item.active {
                    background: #4f46e5;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
                }

                
                /* Main Container */
                .stu-center-wrapper {
                    flex: 1;
                    background: var(--bg-card);
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                }
                
                /* Top Header */
                .stu-top-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 40px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .stu-greeting h1 {
                    font-size: 1.5rem;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                    font-weight: 700;
                }
                .stu-greeting p {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .stu-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .stu-search {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 10px 16px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 250px;
                }
                .stu-search input {
                    border: none;
                    background: transparent;
                    outline: none;
                    width: 100%;
                    font-size: 0.9rem;
                }
                .stu-bell {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    cursor: pointer;
                }
                
                /* Content Area */
                .stu-main-body {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }
                .stu-main-content {
                    flex: 1;
                    padding: 30px 40px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Cards */
                .stu-cards-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stu-stat-card {
                    background: var(--bg-card);
                    border: 1px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .stu-stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    margin-bottom: 12px;
                }
                .stu-stat-text {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                .stu-stat-val {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                
                /* Charts */
                .stu-charts-row {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stu-chart-card {
                    background: var(--bg-card);
                    border: 1px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .stu-bar-chart {
                    display: flex;
                    align-items: flex-end;
                    height: 150px;
                    gap: 12px;
                }
                .stu-bar-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    justify-content: flex-end;
                    gap: 8px;
                    flex: 1;
                }
                .stu-bar {
                    width: 12px;
                    background: #4f46e5;
                    border-radius: 6px;
                }
                .stu-bar-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                
                /* Lists */
                .stu-assignments {
                    background: var(--bg-card);
                    border: 1px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .stu-list-header {
                    display: flex;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 15px;
                }
                .stu-list-row {
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #f8fafc;
                }
                .stu-list-row:last-child {
                    border-bottom: none;
                }
                .stu-list-icon {
                    width: 36px;
                    height: 36px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                .stu-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .stu-badge-success { background: #dcfce7; color: #16a34a; }
                .stu-badge-danger { background: #fee2e2; color: #dc2626; }
                
                /* Right Panel */
                .stu-right-panel {
                    width: 300px;
                    border-left: 1px solid #f1f5f9;
                    padding: 30px 24px;
                    display: flex;
                    flex-direction: column;
                    background: #fdfdfc;
                }
                .stu-profile-widget {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .stu-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    border: 4px solid #fff;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .stu-calendar {
                    background: var(--bg-card);
                    border: 1px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .stu-timeline-item {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .stu-timeline-time {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    width: 40px;
                }
                .stu-timeline-content {
                    flex: 1;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                
                /* Subject Cards (Exams Tab) */
                .stu-subject-card {
                    background: var(--bg-card);
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .stu-subject-card:hover {
                    border-color: #4f46e5;
                    box-shadow: 0 10px 25px rgba(79,70,229,0.1);
                    transform: translateY(-4px);
                }
                .stu-btn-outline {
                    border: 1px solid #4f46e5;
                    color: #4f46e5;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .stu-subject-card:hover .stu-btn-outline {
                    background: #4f46e5;
                    color: #fff;
                }

                /* ── Dark Mode Overrides ── */
                body:not(.light-theme) .stu-layout {
                    background: #0f172a;
                }
                body:not(.light-theme) .stu-center-wrapper {
                    background: #1e293b;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                }
                body:not(.light-theme) .stu-top-header {
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .stu-greeting h1 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-greeting p {
                    color: var(--text-muted);
                }
                body:not(.light-theme) .stu-search {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--text-secondary);
                }
                body:not(.light-theme) .stu-search input {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-bell {
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--text-secondary);
                }
                body:not(.light-theme) .stu-main-content {
                    background: #1e293b;
                }
                body:not(.light-theme) .stu-overview-header h2 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-stat-card {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                body:not(.light-theme) .stu-stat-text {
                    color: var(--text-secondary);
                }
                body:not(.light-theme) .stu-stat-val {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-chart-card {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                body:not(.light-theme) .stu-chart-card h3 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-bar-label {
                    color: #475569;
                }
                body:not(.light-theme) .stu-assignments {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                body:not(.light-theme) .stu-assignments h3 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-list-header {
                    color: #475569;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .stu-list-row {
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                body:not(.light-theme) .stu-list-icon {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                body:not(.light-theme) .stu-right-panel {
                    background: #1a2540;
                    border-left: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .stu-right-panel h3 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-avatar {
                    background: #334155;
                    border: 4px solid #1e293b;
                }
                body:not(.light-theme) .stu-calendar {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .stu-timeline-time {
                    color: #475569;
                }
                body:not(.light-theme) .stu-subject-card {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                body:not(.light-theme) .stu-subject-card h3 {
                    color: #f1f5f9;
                }
                body:not(.light-theme) .stu-nav-item {
                    color: #a5b4fc;
                }
                body:not(.light-theme) .stu-nav-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                }
                `}
            </style>

            <div className="stu-sidebar">
                <div className="stu-logo">
                    <div className="stu-logo-icon">A</div>
                    Academy
                </div>
                
                <div className="stu-nav">
                    <div className=${`stu-nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick=${() => setActiveTab('Dashboard')}>
                        <span>⊞</span> Dashboard
                    </div>
                    <div className=${`stu-nav-item ${activeTab === 'Subjects' ? 'active' : ''}`} onClick=${() => setActiveTab('Subjects')}>
                        <span>📚</span> Subjects
                    </div>
                    <div className=${`stu-nav-item ${activeTab === 'Chat' ? 'active' : ''}`} onClick=${() => setActiveTab('Chat')}>
                        <span>💬</span> Chat
                    </div>
                    <div className=${`stu-nav-item ${activeTab === 'Grades' ? 'active' : ''}`} onClick=${() => setActiveTab('Grades')}>
                        <span>📝</span> Grades
                    </div>
                    <div className=${`stu-nav-item ${activeTab === 'Schedule' ? 'active' : ''}`} onClick=${() => setActiveTab('Schedule')}>
                        <span>📅</span> Schedule
                    </div>
                    <div className=${`stu-nav-item ${activeTab === 'Settings' ? 'active' : ''}`} onClick=${() => setActiveTab('Settings')}>
                        <span>⚙️</span> Settings
                    </div>
                </div>
                

            </div>

            <div className="stu-center-wrapper">
                <div className="stu-top-header">
                    <div className="stu-greeting">
                        <h1>Hello Student 👋</h1>
                        <p>Let's learn something new today!</p>
                    </div>
                    <div className="stu-header-actions">
                        <div className="stu-search">
                            <span>🔍</span>
                            <input type="text" placeholder="Search..." />
                        </div>
                        <div className="stu-bell">🔔</div>
                        <div style=${{width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                            🧑
                        </div>
                    </div>
                </div>
                
                <div className="stu-main-body">
                    ${activeTab === 'Dashboard' && renderDashboardView()}
                    ${activeTab === 'Subjects' && renderSubjectsView()}
                    ${['Chat', 'Grades', 'Schedule', 'Settings'].includes(activeTab) && renderPlaceholder(activeTab)}

                    <div className="stu-right-panel">
                        <div className="stu-profile-widget">
                            <div className="stu-avatar">🧑</div>
                            <h3 style=${{fontSize: '1.1rem', color: 'var(--text-primary)'}}>Test Student</h3>
                            <p style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Computer Science</p>
                        </div>
                        
                        <div className="stu-calendar">
                            <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                                <span style=${{fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)'}}>May 2026</span>
                                <span style=${{color: 'var(--text-secondary)'}}>❮ ❯</span>
                            </div>
                            <div style=${{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center'}}>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>S</span><span>10</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>M</span><span>11</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>T</span><span>12</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px', background: '#4f46e5', color: '#fff', borderRadius: '15px', padding: '4px'}}><span>W</span><span>13</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>T</span><span>14</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>F</span><span>15</span></div>
                                <div style=${{display: 'flex', flexDirection: 'column', gap: '8px'}}><span>S</span><span>16</span></div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 style=${{fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '20px'}}>Upcoming Events</h3>
                            
                            <div className="stu-timeline-item">
                                <div className="stu-timeline-time">10:30</div>
                                <div className="stu-timeline-content" style=${{background: '#fee2e2', color: '#b91c1c'}}>
                                    • Midterm Exam
                                </div>
                            </div>
                            <div className="stu-timeline-item">
                                <div className="stu-timeline-time">14:00</div>
                                <div className="stu-timeline-content" style=${{background: '#e0e7ff', color: '#4338ca'}}>
                                    • Python Lab
                                </div>
                            </div>
                            <div className="stu-timeline-item">
                                <div className="stu-timeline-time">16:30</div>
                                <div className="stu-timeline-content" style=${{background: '#dcfce7', color: '#15803d'}}>
                                    • Study Group
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${selectedSubject && html`
                <div className="modal-overlay animate-fade" onClick=${() => setSelectedSubject(null)}>
                    <div className="glass modal-content animate-slide-up" style=${{maxWidth: '800px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid #e2e8f0'}} onClick=${(e) => e.stopPropagation()}>
                        <div style=${{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem'}}>
                            <div>
                                <h2 style=${{fontSize: '2rem', color: 'var(--text-primary)'}}>${selectedSubject.name}</h2>
                                <p style=${{color: 'var(--text-muted)'}}>Select your preferred mode to start the exam</p>
                            </div>
                            <button onClick=${() => setSelectedSubject(null)} style=${{background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)'}}>✕</button>
                        </div>

                        <div className="mode-selection-grid" style=${{
                            gridTemplateColumns: selectedSubject.noProgramming ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '20px'
                        }}>
                            ${!selectedSubject.noProgramming && html`
                                <div className="stu-stat-card mode-card" onClick=${() => startMode('programming')} style=${{textAlign: 'center', cursor: 'pointer'}}>
                                    <div style=${{fontSize: '3rem', marginBottom: '1.5rem'}}>💻</div>
                                    <h3 style=${{color: 'var(--text-primary)', marginBottom: '10px'}}>Programming</h3>
                                    <p style=${{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Solve real-world coding challenges.</p>
                                    <div style=${{marginTop: '1.5rem', color: '#4f46e5', fontWeight: '700'}}>SELECT →</div>
                                </div>
                            `}
                            <div className="stu-stat-card mode-card" onClick=${() => startMode('viva')} style=${{textAlign: 'center', cursor: 'pointer'}}>
                                <div style=${{fontSize: '3rem', marginBottom: '1.5rem'}}>🗣️</div>
                                <h3 style=${{color: 'var(--text-primary)', marginBottom: '10px'}}>Viva Mode</h3>
                                <p style=${{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Interactive voice-guided session.</p>
                                <div style=${{marginTop: '1.5rem', color: '#4f46e5', fontWeight: '700'}}>SELECT →</div>
                            </div>
                            <div className="stu-stat-card mode-card" onClick=${() => startMode('mcq')} style=${{textAlign: 'center', cursor: 'pointer'}}>
                                <div style=${{fontSize: '3rem', marginBottom: '1.5rem'}}>📝</div>
                                <h3 style=${{color: 'var(--text-primary)', marginBottom: '10px'}}>MCQ Quiz</h3>
                                <p style=${{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Standard multiple choice questions.</p>
                                <div style=${{marginTop: '1.5rem', color: '#4f46e5', fontWeight: '700'}}>SELECT →</div>
                            </div>
                        </div>
                    </div>
                </div>
            `}

            ${showInstructions && html`
                <div className="modal-overlay animate-fade">
                    <div className="glass modal-content animate-slide-up" style=${{maxWidth: '700px', padding: '3rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid #e2e8f0'}}>
                        <h2 style=${{fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px'}}>
                            <span>📜</span> Exam Instructions
                        </h2>
                        
                        <div style=${{background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', lineHeight: '1.7'}}>
                            <h3 style=${{color: '#4f46e5', marginBottom: '1rem', fontSize: '1.1rem', textTransform: 'uppercase'}}>Rules & Requirements:</h3>
                            <ul style=${{listStyle: 'none', padding: 0, color: '#4a5568'}}>
                                <li style=${{marginBottom: '1rem', display: 'flex', gap: '10px'}}>
                                    <span style=${{color: '#16a34a'}}>✓</span>
                                    <span><b>Camera & Microphone:</b> Access must be granted for continuous AI proctoring.</span>
                                </li>
                                <li style=${{marginBottom: '1rem', display: 'flex', gap: '10px'}}>
                                    <span style=${{color: '#dc2626'}}>✗</span>
                                    <span><b>No Gadgets:</b> Mobile phones, smartwatches, and Bluetooth devices are strictly prohibited.</span>
                                </li>
                                <li style=${{marginBottom: '1rem', display: 'flex', gap: '10px'}}>
                                    <span style=${{color: '#dc2626'}}>✗</span>
                                    <span><b>Lockdown Mode:</b> Exiting fullscreen or switching tabs will be flagged as a violation.</span>
                                </li>
                            </ul>
                        </div>

                        <div style=${{marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-primary)'}} onClick=${() => setHasAgreed(!hasAgreed)}>
                            <input 
                                type="checkbox" 
                                checked=${hasAgreed} 
                                onChange=${(e) => setHasAgreed(e.target.checked)}
                                style=${{width: '20px', height: '20px', cursor: 'pointer', accentColor: '#4f46e5'}}
                            />
                            <span style=${{fontSize: '1.05rem', fontWeight: '500'}}>I have read the instructions and agree to the proctoring terms.</span>
                        </div>

                        <div style=${{display: 'flex', gap: '16px'}}>
                            <button 
                                style=${{flex: 1, padding: '15px', fontSize: '1.1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: hasAgreed ? 'pointer' : 'not-allowed', opacity: hasAgreed ? 1 : 0.5}}
                                disabled=${!hasAgreed}
                                onClick=${initiateExam}
                            >
                                START ASSESSMENT NOW
                            </button>
                            <button 
                                style=${{padding: '15px 30px', background: 'var(--bg-card)', border: '1px solid #e2e8f0', color: '#4a5568', borderRadius: '12px', fontWeight: '600', cursor: 'pointer'}}
                                onClick=${() => setShowInstructions(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </div>
    `;
};

export default Dashboard;
