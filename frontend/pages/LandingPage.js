import React from 'react';
import htm from 'htm';
import { Link } from 'react-router-dom';

const html = htm.bind(React.createElement);

const LandingPage = () => {
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const moveX = (clientX - window.innerWidth / 2) / 50;
        const moveY = (clientY - window.innerHeight / 2) / 50;
        setMousePos({ x: moveX, y: moveY });
    };

    const subjects = [
        { name: 'Data Structures',                    icon: '🌳', description: 'Arrays, Trees, Graphs, and advanced data organization.' },
        { name: 'Database Management Systems',        icon: '🗄️', description: 'SQL, normalization, transactions, and query optimization.' },
        { name: 'OOPs through JAVA',                  icon: '☕', description: 'Object-oriented design patterns and JAVA programming.' },
        { name: 'Operating Systems',                  icon: '🖥️', description: 'Process management, memory, and file systems.' },
        { name: 'Computer Networks',                  icon: '🌐', description: 'Protocols, TCP/IP, routing, and network security.' },
        { name: 'Machine Learning',                   icon: '🤖', description: 'Supervised, unsupervised, and deep learning models.' },
        { name: 'Cryptography & Network Security',    icon: '🔐', description: 'Encryption, ciphers, PKI, and secure communication.' },
        { name: 'Cloud Computing',                    icon: '☁️', description: 'AWS, Azure, virtualization, and cloud-native services.' },
        { name: 'Introduction to Artificial Intelligence', icon: '🧠', description: 'Search, logic, knowledge representation, and AI agents.' },
    ];

    return html`
        <div className="landing-page" onMouseMove=${handleMouseMove}>
            
            <!-- Hero Section -->
            <section className="hero">
                <div className="container" style=${{display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap', width: '100%'}}>
                    <div className="hero-visual-container" style=${{flex: '1 1 500px', position: 'relative'}}>
                        <img src="assets/pro-robot-ai.jpg?v=5" 
                             alt="Professional AI Robot" 
                             className="hero-visual-img" 
                             style=${{
                                 width: '100%',
                                 height: '65vh',
                                 minHeight: '450px',
                                 objectFit: 'cover',
                                 transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
                                 borderRadius: '24px',
                                 boxShadow: '0 0 50px var(--primary-accent-glow)',
                                 filter: 'contrast(1.1) brightness(0.95)' 
                             }} />
                    </div>
                    <div style=${{flex: '1 1 400px', textAlign: 'left'}}>
                        <h1 style=${{color: 'var(--primary-accent)', fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1', fontWeight: '800'}}>AI Learning Platform</h1>
                        <p style=${{fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem'}}>Smart Exams. Better Learning. Experience the future of assessment with our AI-powered evaluation platform.</p>
                        <div className="cta-group" style=${{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                            <${Link} to="/dashboard" className="btn btn-primary" style=${{padding: '16px 32px', fontSize: '1.1rem'}}>Start Exam</${Link}>
                            <a href="#subjects" className="btn btn-outline" style=${{padding: '16px 32px', fontSize: '1.1rem'}}>Explore Subjects</a>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section id="features" className="section">
                <div className="container">
                    <div className="flex-center" style=${{marginBottom: '60px'}}>
                        <h2 style=${{fontSize: '2.5rem', marginBottom: '16px', color: 'var(--primary-accent)'}}>Engineered for Excellence</h2>
                        <p style=${{color: 'var(--text-secondary)'}}>Premium features for the modern student</p>
                    </div>
                    
                    <div style=${{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', width: '100%', marginBottom: '40px'}}>
                        <div style=${{padding: '20px'}}>
                            <div className="feature-icon">📚</div>
                            <h3>Multiple Subjects</h3>
                            <p style=${{color: 'var(--text-secondary)', marginTop: '12px'}}>Comprehensive coverage across academic domains with dynamic content.</p>
                        </div>
                        <div style=${{padding: '20px'}}>
                            <div className="feature-icon">⚡</div>
                            <h3>Flexible Modes</h3>
                            <p style=${{color: 'var(--text-secondary)', marginTop: '12px'}}>Choose from interactive Viva, standard MCQs, or real-time Programming challenges.</p>
                        </div>
                        <div style=${{padding: '20px'}}>
                            <div className="feature-icon">🏆</div>
                            <h3>Instant Scoring</h3>
                            <p style=${{color: 'var(--text-secondary)', marginTop: '12px'}}>Real-time performance evaluation powered by advanced AI logic.</p>
                        </div>
                        <div style=${{padding: '20px'}}>
                            <div className="feature-icon">✨</div>
                            <h3>Smooth UX</h3>
                            <p style=${{color: 'var(--text-secondary)', marginTop: '12px'}}>Minimal, distraction-free interface designed for deep focus.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- How It Works Section -->
            <section className="section" style=${{background: 'rgba(255,255,255,0.02)'}}>
                <div className="container flex-center">
                    <div style=${{marginBottom: '60px', position: 'relative'}}>
                        <div className="pro-visual-accent"></div>
                        <h2 style=${{fontSize: '3.5rem', color: 'var(--primary-accent)', fontWeight: '900'}}>INTELLIGENT</h2>
                    </div>
                    <h2 style=${{fontSize: '2.5rem', color: 'var(--primary-accent)'}}>How It Works</h2>
                    <p style=${{color: 'var(--text-secondary)'}}>Streamlined workflow from start to finish</p>
                    
                    <div className="steps" style=${{width: '100%'}}>
                        <div className="step">
                            <div className="step-circle">1</div>
                            <h4>Choose Subject</h4>
                            <p>Browse our catalog and select your target field.</p>
                        </div>
                        <div className="step">
                            <div className="step-circle">2</div>
                            <h4>Select Exam Type</h4>
                            <p>Pick the assessment mode that suits your goals.</p>
                        </div>
                        <div className="step">
                            <div className="step-circle">3</div>
                            <h4>Complete Exam</h4>
                            <p>Solve challenges with our intelligent platform.</p>
                        </div>
                        <div className="step">
                            <div className="step-circle">4</div>
                            <h4>View Score</h4>
                            <p>Receive instant analysis and performance metrics.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Highlight Section -->
            <section className="section">
                <div className="container">
                    <div className="highlight">
                        <h2 style=${{fontSize: '3rem', marginBottom: '24px'}} className="gradient-text">
                            AI-Powered Evaluation
                        </h2>
                        <p style=${{fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 40px'}}>
                            Our platform leverages large language models to provide instant, accurate feedback on your performance, whether it's a coding problem or a verbal response.
                        </p>
                        <div style=${{display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap'}}>
                            <div style=${{textAlign: 'center'}}>
                                <div style=${{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-accent)'}}>99%</div>
                                <div style=${{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Accuracy Rate</div>
                            </div>
                            <div style=${{textAlign: 'center'}}>
                                <div style=${{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-accent)'}}>Instant</div>
                                <div style=${{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Evaluation Time</div>
                            </div>
                            <div style=${{textAlign: 'center'}}>
                                <div style=${{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-accent)'}}>500+</div>
                                <div style=${{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Subjects Covered</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Secondary AI Image Section -->
            <section className="section" style=${{paddingTop: '20px', paddingBottom: '20px'}}>
                <div className="container flex-center">
                         <img src="assets/secondary-banner.jpg?v=1" 
                              alt="Technology Visualization" 
                              style=${{
                                  width: '100%', 
                                  maxWidth: '900px', 
                                  height: 'auto',
                                  maxHeight: '400px',
                                  objectFit: 'cover',
                                  borderRadius: '24px', 
                                  boxShadow: '0 10px 40px var(--primary-accent-glow)',
                                  border: '1px solid var(--border-dim)'
                              }} 
                         />
                </div>
            </section>

            <!-- Subjects Section -->
            <section id="subjects" className="section" style=${{paddingTop: '40px'}}>
                <div className="container">
                    <div className="flex-center" style=${{marginBottom: '60px'}}>
                        <h2 style=${{fontSize: '2.5rem', marginBottom: '16px', color: 'var(--primary-accent)'}}>Popular Subjects</h2>
                        <p style=${{color: 'var(--text-secondary)'}}>Start your journey with our top-rated tests</p>
                    </div>
                    
                    <div className="card-grid">
                        ${subjects.map(subject => html`
                            <div key=${subject.name} className="card">

                                <h3 style=${{marginBottom: '12px'}}>${subject.name}</h3>
                                <p style=${{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem'}}>${subject.description}</p>
                                <${Link} to="/dashboard" className="btn btn-primary" style=${{width: '100%', textAlign: 'center'}}>
                                    Start Exam
                                </${Link}>
                            </div>
                        `)}
                    </div>
                </div>
            </section>

            <!-- About Section -->
            <section id="about" className="section" style=${{background: 'rgba(255,255,255,0.02)'}}>
                <div className="container">
                    <div className="flex-center">
                        <h2 style=${{fontSize: '2.5rem', marginBottom: '24px', color: 'var(--primary-accent)'}}>About Our Platform</h2>
                        <p style=${{color: 'var(--text-secondary)', maxWidth: '800px', fontSize: '1.1rem'}}>
                            We are dedicated to revolutionizing the way students prepare for their academic and professional careers. Our platform combines the power of artificial intelligence with proven educational methodologies to provide a personalized, efficient, and engaging learning experience. Whether you're mastering a new programming language or preparing for a competitive exam, we're here to help you succeed.
                        </p>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section className="section">
                <div className="container flex-center">
                    <h2 style=${{fontSize: '3.5rem', marginBottom: '32px', textAlign: 'center'}}>
                        Start Your Exam Journey Today
                    </h2>
                    <${Link} to="/dashboard" className="btn btn-primary" style=${{padding: '16px 40px', fontSize: '1.1rem'}}>
                        Get Started Now
                    </${Link}>
                </div>
            </section>

            <!-- Footer -->
            <footer>
                <div className="container">
                    <div className="footer-content">
                        <div className="logo">AI Platform</div>
                    </div>
                    <div className="footer-bottom">
                        &copy; 2026 AI Learning. Futuristic Assessment Platform.
                    </div>
                </div>
            </footer>

        </div>
    `;
};

export default LandingPage;
