import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { useParams, useNavigate } from 'react-router-dom';
import { SUBJECTS } from './Dashboard.js';
import { jsPDF } from 'jspdf';
import Editor from '@monaco-editor/react';

const LANGUAGE_TEMPLATES = {
    'Python': 'import sys\n\ndef main():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    main()',
    'Java': 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your code here\n    }\n}',
    'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
    'C': '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}',
    'JavaScript': 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8");\n\nfunction main() {\n    // Write your code here\n}\nmain();',
    'C#': 'using System;\n\nclass Solution {\n    static void Main(String[] args) {\n        // Write your code here\n    }\n}',
    'PHP': '<?php\n// Write your code here\n?>',
    'Ruby': '# Write your code here',
    'Go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n}'
};

const html = htm.bind(React.createElement);

const QuestionPage = () => {
    const { subject } = useParams();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(window.location.search);
    const initialMode = queryParams.get('mode');

    const [difficulty, setDifficulty] = useState('Basic');
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState(LANGUAGE_TEMPLATES['Python']);
    const [language, setLanguage] = useState('Python');
    const languages = ['Python', 'Java', 'C', 'C++', 'JavaScript', 'C#', 'PHP', 'Ruby', 'Go'];
    const [vivaMode, setVivaMode] = useState(initialMode === 'viva');
    const [quizMode, setQuizMode] = useState(initialMode === 'mcq');
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const [score, setScore] = useState(0);
    const [totalAttempted, setTotalAttempted] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [history, setHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
    const [studentRating, setStudentRating] = useState(0);
    const [violationCount, setViolationCount] = useState(0);
    const violationCountRef = useRef(0); // ref so event handlers always see fresh value
    const lastViolationTimeRef = useRef(0); // cooldown tracker
    const blurTimerRef = useRef(null); // delayed blur handler
    const [isViolation, setIsViolation] = useState(false);
    const [violationReason, setViolationReason] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState({ count: 0, reason: '', isInfoOnly: false });
    const [graceCooldown, setGraceCooldown] = useState(0); // seconds remaining in grace period
    const graceTimerRef = useRef(null);
    const [isProgressive, setIsProgressive] = useState(false);
    const [qStartTime, setQStartTime] = useState(Date.now());
    const [shuffledOptions, setShuffledOptions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const isFirstLoadRef = useRef(true); 
    const isApiFSInit = !!(document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement);
    const isF11FSInit = window.matchMedia('(display-mode: fullscreen)').matches || Math.abs(window.screen.height - window.innerHeight) <= 3;
    const [examReady, setExamReady] = useState(isApiFSInit || isF11FSInit);
    const [fsError, setFsError] = useState('');
    const [fsLoading, setFsLoading] = useState(false);
    const isHandlingFinishRef = useRef(false);
    const [testResults, setTestResults] = useState(null);
    const [runningCode, setRunningCode] = useState(false);
    const [examStartTime, setExamStartTime] = useState(null);
    const [examEndTime, setExamEndTime] = useState(null);
    
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';
    
    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData?.id || 0;
    
    const subjectData = SUBJECTS.find(s => s.name === decodeURIComponent(subject));
    const isNoProg = subjectData?.noProgramming;
    
    const [vivaAnswer, setVivaAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    
    // AI Proctoring State & Refs
    const [aiModelsLoaded, setAiModelsLoaded] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const blazefaceModelRef = useRef(null);
    const cocossdModelRef = useRef(null);
    const reenteringFullscreenRef = useRef(false); // guard: our own re-entry shouldn't loop
    const showWarningRef = useRef(false); // mirror of showWarning for use inside event handlers
    const [isFullscreen, setIsFullscreen] = useState(!!(document.fullscreenElement || document.webkitFullscreenElement));

    const MAX_QUESTIONS = quizMode ? 25 : (vivaMode ? 15 : 3);
    const levels = ['Basic', 'Easy', 'Medium', 'Hard'];

    // Load AI Models on mount with retry logic
    useEffect(() => {
        let attempts = 0;
        const loadModels = async () => {
            try {
                if (window.blazeface && window.cocoSsd) {
                    blazefaceModelRef.current = await window.blazeface.load();
                    cocossdModelRef.current = await window.cocoSsd.load();
                    setAiModelsLoaded(true);
                } else if (attempts < 10) {
                    attempts++;
                    setTimeout(loadModels, 1000); // Retry after 1s
                }
            } catch (e) {
                console.error("AI Model Loading Error:", e);
            }
        };
        loadModels();
    }, []);

    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // Persistence: Restore session from Backend on mount — only after user clicks to enter fullscreen
    useEffect(() => {
        if (!examReady) return; // Wait for the user to click "Enter Fullscreen"
        const initSession = async () => {
            try {
                // 1. Try to find active session
                const res = await fetch(`http://127.0.0.1:8000/sessions/active/${userId}/${encodeURIComponent(subject)}`);
                const data = await res.json();
                
                let currentSession = data.id ? data : null;
                
                // 2. If no active session, start one
                if (!currentSession) {
                    const startRes = await fetch('http://127.0.0.1:8000/sessions/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: userId,
                            subject: subject,
                            mode: initialMode || 'mcq',
                            difficulty: 'Basic',
                            total_questions: MAX_QUESTIONS
                        })
                    });
                    currentSession = await startRes.json();
                }
                
                // 3. Sync state
                if (currentSession) {
                    setSessionId(currentSession.id);
                    setScore(currentSession.current_score || 0);
                    setTotalAttempted(currentSession.questions_attempted || 0);
                    setDifficulty(currentSession.difficulty || 'Basic');
                    const historyData = JSON.parse(currentSession.history || '[]');
                    setHistory(historyData);
                    
                    // Set start time from session or current time
                    setExamStartTime(currentSession.start_time ? new Date(currentSession.start_time) : new Date());
                    
                    // Generate first question if none exists
                    if (historyData.length === 0) {
                        generateQuestion(currentSession.difficulty || 'Basic');
                    } else {
                        generateQuestion(currentSession.difficulty || 'Basic');
                    }
                }
            } catch (err) {
                console.error("Session init error:", err);
            }
        };
        initSession();
    }, [examReady]);

    // Local backup for UI stability
    useEffect(() => {
        if (!showReport && question) {
            localStorage.setItem(`session_backup_${subject}`, JSON.stringify({
                history, score, timeLeft, difficulty
            }));
        }
    }, [history, score, timeLeft, difficulty]);
    
    // Exam mode body class toggle
    useEffect(() => {
        if (question && !showReport) {
            document.body.classList.add('exam-mode');
        } else {
            document.body.classList.remove('exam-mode');
        }
        return () => document.body.classList.remove('exam-mode');
    }, [question, showReport]);


    // Lockdown: silently enforce exam environment — NO violations triggered here
    useEffect(() => {
        if (showReport || !question || !examReady) return;

        // Trap back button silently
        window.history.pushState({ exam: true }, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState({ exam: true }, '', window.location.href);
        };

        // Lockdown: silently enforce exam environment — NO violations triggered here
        const handleFullscreenChange = () => {
            if (isDebug) return;
            const isApiFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            const isF11FS = window.matchMedia('(display-mode: fullscreen)').matches || Math.abs(window.screen.height - window.innerHeight) <= 3;
            const current = isApiFS || isF11FS;
            setIsFullscreen(current);
            if (!current) {
                triggerViolation("Exited fullscreen mode. Exam cancelled.", true);
            }
        };

        // Warn before leaving page
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'Exam is in progress. Are you sure you want to leave?';
            return e.returnValue;
        };
        
        // Tab switching detection
        const handleVisibilityChange = () => {
            if (document.hidden && !showWarningRef.current) {
                triggerViolation("Tab switching / backgrounding detected");
            }
        };

        // Block cheating shortcuts and trigger violations
        const preventCheating = (e) => {
            if (['contextmenu', 'copy'].includes(e.type)) {
                e.preventDefault();
                triggerViolation(`Attempted to ${e.type}`);
                return;
            }
            if (e.type === 'selectstart') {
                e.preventDefault();
                return;
            }
            if (e.type === 'keydown') {
                const k = e.key.toLowerCase();
                const blockedCtrl = ['t','n','w','u','s','p','f','r','l','j','k'];
                if (e.ctrlKey && blockedCtrl.includes(k)) { e.preventDefault(); return; }
                if (e.ctrlKey && e.shiftKey && ['i','j','n'].includes(k)) { e.preventDefault(); return; }
                if (e.key === 'F5' || e.key === 'F12') { e.preventDefault(); return; }
                if (e.altKey && ['F4','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); return; }
                if (e.key === 'Escape') { e.preventDefault(); return; }
            }
        };

        // Exam timer and continuous fullscreen enforcement
        let graceTimer;
        if (isFirstLoadRef.current) {
            graceTimer = setTimeout(() => { isFirstLoadRef.current = false; }, 8000); // 8s grace on start
        }

        const timer = setInterval(() => {
            const isGraceActive = isFirstLoadRef.current;
            const isApiFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            const isF11FS = window.matchMedia('(display-mode: fullscreen)').matches || Math.abs(window.screen.height - window.innerHeight) <= 3;
            const currentFS = isApiFS || isF11FS;
            
            // Sync state just in case
            if (currentFS !== isFullscreen) setIsFullscreen(currentFS);

            if (!isDebug && !isGraceActive && !currentFS && !showWarningRef.current) {
                triggerViolation("Exam must be taken in fullscreen mode");
            }
            setTimeLeft(prev => {
                if (prev === 601) { playAlertTone(); speak("Ten minutes remaining."); }
                if (prev === 301) { playAlertTone(); speak("Five minutes remaining."); }
                if (prev <= 1) { clearInterval(timer); finishSession(); return 0; }
                return prev - 1;
            });
        }, 1000);

        lockNewTabs();

        window.addEventListener('popstate', handlePopState);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('contextmenu', preventCheating);
        window.addEventListener('copy', preventCheating);
        window.addEventListener('selectstart', preventCheating);
        window.addEventListener('keydown', preventCheating, true);

        return () => {
            clearInterval(timer);
            if (graceTimer) clearTimeout(graceTimer);
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            unlockNewTabs();
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('contextmenu', preventCheating);
            window.removeEventListener('copy', preventCheating);
            window.removeEventListener('selectstart', preventCheating);
            window.removeEventListener('keydown', preventCheating, true);
        };
    }, [showReport, question, examReady]);

    // AI Proctoring Effect
    useEffect(() => {
        if (showReport || !question || !aiModelsLoaded) return;

        let detectionInterval;
        let isActive = true;

        const startProctoring = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                // Audio analysis setup
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = audioContext;
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                analyser.fftSize = 512;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                detectionInterval = setInterval(async () => {
                    if (isDebug || !isActive || showWarningRef.current) return; 
                    
                    try {
                        // 0. Bluetooth Device Detection
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const bluetoothDevice = devices.find(d => {
                            const label = d.label.toLowerCase();
                            return label.includes('bluetooth') || 
                                   label.includes('airpods') || 
                                   label.includes('buds') || 
                                   label.includes('hands-free');
                        });
                        if (bluetoothDevice) {
                            triggerViolation(`Bluetooth device detected (${bluetoothDevice.label}). Please disconnect all Bluetooth devices to continue.`);
                            return;
                        }

                        // Ensure context is running (browsers often suspend it)
                        if (audioContext.state === 'suspended') await audioContext.resume();

                        // 1. Audio Check (Amplitude Detection)
                        analyser.getByteTimeDomainData(dataArray);
                        let maxVal = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            const val = Math.abs(dataArray[i] - 128);
                            if (val > maxVal) maxVal = val;
                        }
                        
                        // Threshold 45 is less sensitive
                        if (maxVal > 45) {
                            triggerViolation("Talking or whispering detected. Please maintain absolute silence.");
                            return;
                        }

                        // 2. Video Analysis
                        const video = videoRef.current;
                        if (video && video.readyState === 4 && video.videoWidth > 0) {
                            // BlazeFace (Faces)
                            const faces = await blazefaceModelRef.current.estimateFaces(videoRef.current, false);
                            if (faces.length === 0) {
                                triggerViolation("Face not detected in camera");
                            } else if (faces.length > 1) {
                                triggerViolation("Multiple people detected");
                            } else if (faces.length === 1 && faces[0].landmarks) {
                                const face = faces[0];
                                const probability = face.probability ? (Array.isArray(face.probability) ? face.probability[0] : face.probability) : 1.0;
                                
                                // INCREASED: Stricter threshold for face obstruction/camera covering
                                if (probability < 0.97) {
                                    triggerViolation("Face partially covered or obstructed. Please ensure your full face is visible.", false, true);
                                    return;
                                }

                                const [x1, y1] = face.topLeft;
                                const [x2, y2] = face.bottomRight;
                                const vW = videoRef.current.videoWidth;
                                const vH = videoRef.current.videoHeight;
                                
                                // Enforce strict face centering to prevent camera covering/hiding in corners
                                const faceCenterX = (x1 + x2) / 2;
                                const faceCenterY = (y1 + y2) / 2;
                                
                                if (Math.abs(faceCenterX - (vW / 2)) > vW * 0.25 || Math.abs(faceCenterY - (vH / 2)) > vH * 0.3) {
                                    triggerViolation("Face is not centered. Please sit directly in front of the camera.", false, true);
                                    return;
                                }

                                // Check if face is too far
                                const faceWidth = x2 - x1;
                                if (faceWidth < vW * 0.1) { // Min size
                                    triggerViolation("Face is too far from the camera.");
                                    return;
                                }

                                // Head turn and Mouth movement detection using landmarks
                                // landmarks: [rightEye, leftEye, nose, mouth, rightEar, leftEar]
                                const rightEye = face.landmarks[0];
                                const leftEye = face.landmarks[1];
                                const nose = face.landmarks[2];
                                const mouth = face.landmarks[3];

                                // 1. STRICTOR: Landmark Consistency Check (Detect hands over face)
                                if (rightEye && leftEye && nose && mouth) {
                                    const eyeDist = Math.abs(rightEye[0] - leftEye[0]);
                                    // If eyes are too close together relative to face width, it's likely an occlusion/hand
                                    if (eyeDist < faceWidth * 0.2) {
                                        triggerViolation("Face obstructed. Please remove your hand from your face.", false, true);
                                        return;
                                    }

                                    // Check vertical alignment: Eyes > Nose > Mouth
                                    // Note: Y coordinates increase downwards
                                    if (rightEye[1] > nose[1] || leftEye[1] > nose[1] || nose[1] > mouth[1]) {
                                        triggerViolation("Face structure distorted. Please ensure your full face is visible.", false, true);
                                        return;
                                    }
                                }

                                // 2. Mouth Opening Detection (Visual Talking)
                                if (mouth && nose) {
                                    const dist = Math.sqrt(Math.pow(mouth[0] - nose[0], 2) + Math.pow(mouth[1] - nose[1], 2));
                                    const faceHeight = y2 - y1;
                                    // Relaxed sensitivity for mouth movement
                                    if (dist > faceHeight * 0.40) {
                                        triggerViolation("Mouth movement detected. Talking is strictly prohibited.");
                                        return;
                                    }
                                }

                                // 3. Head Turn Detection
                                if (nose && rightEye && leftEye) {
                                    const distRight = Math.abs(nose[0] - rightEye[0]);
                                    const distLeft = Math.abs(leftEye[0] - nose[0]);
                                    
                                    if (distRight > 0 && distLeft > 0) {
                                        const ratio = distRight / distLeft;
                                        if (ratio > 4.0 || ratio < 0.25) {
                                            triggerViolation("Face turned away from screen");
                                            return;
                                        }
                                    }
                                }
                            }

                            // COCO-SSD (Objects)
                            const predictions = await cocossdModelRef.current.detect(videoRef.current);
                            const bannedDevices = ['cell phone', 'remote', 'watch', 'laptop', 'tablet']; 
                            // Relaxed threshold (0.5) to catch gadgets
                            const unauthorizedDevice = predictions.find(p => bannedDevices.includes(p.class) && p.score > 0.5);
                            
                            if (unauthorizedDevice) {
                                // Instant termination for unauthorized gadgets
                                triggerViolation(`Unauthorized electronic device (${unauthorizedDevice.class}) detected. Exam cancelled.`, true);
                            }
                        }
                    } catch (err) {
                        console.error("Detection error:", err);
                    }
                }, 800); // Faster detection interval (800ms)

            } catch (err) {
                console.error("Failed to start proctoring:", err);
                triggerViolation("Camera or Microphone access denied");
            }
        };

        startProctoring();

        return () => {
            isActive = false;
            if (detectionInterval) clearInterval(detectionInterval);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, [showReport, question, aiModelsLoaded]);

    // Warning modal relies on the user clicking the dismiss button to re-enter fullscreen.

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const GRACE_PERIOD_SECONDS = 5; // Minimal 5-second debounce between violations

    const triggerViolation = (reason, instantKill = false, isInfoOnly = false) => {
        if (showReport) return;

        // Grace period: block new violations while cooldown is active
        const now = Date.now();
        const gracePeriodMs = GRACE_PERIOD_SECONDS * 1000;
        if (!instantKill && now - lastViolationTimeRef.current < gracePeriodMs) return;
        if (!instantKill) lastViolationTimeRef.current = now;

        if (isInfoOnly) {
            showWarningRef.current = true;
            setWarningMessage({ count: violationCountRef.current, reason, isInfoOnly: true });
            setShowWarning(true);
            return;
        }

        // Use ref so we always get the real current count (avoids stale closure bug)
        violationCountRef.current = instantKill ? 4 : violationCountRef.current + 1;
        const newCount = violationCountRef.current;
        setViolationCount(newCount);

        if (newCount <= 5) {
            showWarningRef.current = true;
            setWarningMessage({ count: newCount, reason, isInfoOnly: false });
            setShowWarning(true);
        } else {
            setIsViolation(true);
            setViolationReason(reason);
            finishSession(null, true, reason);
        }
    };

    const dismissWarning = () => {
        showWarningRef.current = false;
        setShowWarning(false);
        enterFullscreen();
    };

    const enterFullscreen = () => {
        const elem = document.documentElement;
        const request = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
        
        if (!request) {
            alert("Your browser does not support fullscreen mode. Please use a modern browser like Chrome, Edge, or Firefox.");
            return Promise.resolve(false);
        }

        return request.call(elem)
            .then(() => {
                setIsFullscreen(true);
                return true;
            })
            .catch((err) => {
                console.error("Fullscreen failed:", err);
                // Fallback attempt on body
                return document.body.requestFullscreen ? document.body.requestFullscreen().then(()=>true).catch(()=>false) : false;
            });
    };

    // Block all new tab/window openings during exam — silently
    const lockNewTabs = () => {
        window._originalOpen = window.open;
        window.open = () => null; // silently block, no violation
    };

    const unlockNewTabs = () => {
        if (window._originalOpen) window.open = window._originalOpen;
    };

    const speak = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const playAlertTone = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (err) {
            console.warn("Audio alert failed:", err);
        }
    };

    const runCode = async () => {
        if (!question || !question.test_cases) {
            alert("No test cases available for this question.");
            return;
        }
        
        setRunningCode(true);
        setTestResults(null);
        
        try {
            const testCases = typeof question.test_cases === 'string' ? JSON.parse(question.test_cases) : question.test_cases;
            const res = await fetch('http://127.0.0.1:8000/run-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    test_cases: testCases
                })
            });
            
            if (!res.ok) throw new Error("Execution failed");
            
            const data = await res.json();
            // Ensure data is an array to avoid crashes
            setTestResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            alert("Failed to run code. Please check your connection or syntax.");
            setTestResults([]); // Reset to empty array on error
        } finally {
            setRunningCode(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newValue = code.substring(0, start) + "    " + code.substring(end);
            setCode(newValue);
            // Use setTimeout to ensure the cursor position is updated after the state change
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        }
    };

    const toggleListening = () => {
        // Aggressively try to re-enter fullscreen on user gesture
        enterFullscreen();

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setVivaAnswer(transcript);
        };
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };



    const generateQuestion = async (forcedDifficulty = null) => {
        const targetDifficulty = forcedDifficulty || difficulty;
        setLoading(true);
        setFeedback(null);
        setSelectedOption(null);
        try {
            const res = await fetch('http://127.0.0.1:8000/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject, 
                    difficulty: targetDifficulty,
                    q_type: quizMode ? 'mcq' : (vivaMode ? 'viva' : 'coding')
                })
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to generate question');
            }

            const data = await res.json();
            
            // Format options if MCQ
            if (quizMode || data.input_format?.includes('|')) {
                const opts = data.input_format?.split('|') || [];
                data.options = opts;
                setShuffledOptions(shuffleArray(opts));
            }
            
            setQuestion(data);
            setQStartTime(Date.now());
            setVivaAnswer('');
            
            if (vivaMode) {
                const questionText = data.question || data.problem_statement;
                const text = quizMode ? `Quiz Question: ${questionText}` : `Viva Question: ${questionText}. Please explain your answer.`;
                speak(text);
            }
        } catch (err) {
            console.error(err);
            alert(`AI Generation Error: ${err.message}. Please try again in a few moments.`);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const finishSession = async (lastSelection = null, viaViolation = false, reason = null) => {
        if (isHandlingFinishRef.current) return;
        isHandlingFinishRef.current = true;

        // Formally close session on backend
        if (sessionId) {
            try {
                await fetch(`http://127.0.0.1:8000/sessions/finish/${sessionId}`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        is_violated: viaViolation ? 1 : 0,
                        violation_reason: reason
                    })
                });
            } catch (err) {
                console.error("Backend session finish error:", err);
            }
        }
        setExamEndTime(new Date());
        localStorage.removeItem(`session_${subject}`);
        localStorage.removeItem(`session_backup_${subject}`);
        
        let finalScore = score;
        let finalTotal = history.length;
        
        // Record final question if not already in history (check BOTH current state and MAX_QUESTIONS)
        if (question && history.length < MAX_QUESTIONS && !viaViolation) {
            const finalSelection = lastSelection || selectedOption;
            const isCorrect = vivaMode ? false : (finalSelection === question.output_format);
            const timeTaken = Math.floor((Date.now() - qStartTime) / 1000);
            const result = {
                question: question.problem_statement || question.question,
                selected: finalSelection,
                correct: question.output_format,
                isCorrect,
                explanation: question.explanation,
                timeSpent: timeTaken
            };
            
            // Only add if not already handled by handleNextLevel
            // Since finishSession can be called by handleNextLevel, we check if it's already at max
            setHistory(prev => {
                if (prev.length >= MAX_QUESTIONS) return prev;
                return [...prev, result];
            });
            
            setTotalAttempted(prev => Math.min(prev + 1, MAX_QUESTIONS));
            if (isCorrect) {
                finalScore += 1;
                setScore(prev => prev + 1);
            }
            finalTotal = Math.min(finalTotal + 1, MAX_QUESTIONS);
        }
        setShowReport(true);
        
        // Save to global student stats
        const statsStr = localStorage.getItem('studentStats');
        const stats = statsStr ? JSON.parse(statsStr) : [];
        stats.unshift({
            subject: decodeURIComponent(subject || 'Unknown'),
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            startTime: examStartTime ? examStartTime.toISOString() : new Date().toISOString(),
            endTime: new Date().toISOString(),
            score: finalScore,
            total: MAX_QUESTIONS,
            violation: viaViolation,
            violationReason: viaViolation ? reason : null
        });
        if (stats.length > 20) stats.pop();
        localStorage.setItem('studentStats', JSON.stringify(stats));

        if (viaViolation) {
            speak("Violation detected. Exam submitted automatically.");
        } else {
            speak("Session complete.");
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const timestamp = new Date().toLocaleString();
        
        // Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text("AI ASSESSMENT PERFORMANCE REPORT", pageWidth / 2, 25, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text("Official Record of Examination", pageWidth / 2, 35, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        
        // Candidate Box
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 55, pageWidth - 40, 50);
        
        doc.setFont(undefined, 'bold');
        doc.text("CANDIDATE INFORMATION", 25, 65);
        doc.setFont(undefined, 'normal');
        doc.line(25, 67, 85, 67);
        
        doc.text(`Name:`, 25, 75);
        doc.setFont(undefined, 'bold');
        doc.text(`${userData?.name || 'Unknown'}`, 60, 75);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Candidate ID:`, 25, 83);
        doc.text(`${userId}`, 60, 83);
        
        doc.text(`Subject:`, 25, 91);
        doc.setFont(undefined, 'bold');
        doc.text(`${decodeURIComponent(subject)}`, 60, 91);
        doc.setFont(undefined, 'normal');

        doc.text(`Exam Started:`, 110, 75);
        doc.text(`${examStartTime ? examStartTime.toLocaleString() : 'N/A'}`, 145, 75);
        
        doc.text(`Exam Ended:`, 110, 83);
        doc.text(`${examEndTime ? examEndTime.toLocaleString() : new Date().toLocaleString()}`, 145, 83);
        
        const correctCount = history.filter(h => h.isCorrect).length;
        const wrongCount = history.length - correctCount;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("ASSESSMENT SUMMARY", 20, 120);
        doc.rect(20, 123, pageWidth - 40, 0.5, 'F');
        
        const totalSeconds = (examEndTime && examStartTime) ? Math.floor((examEndTime - examStartTime) / 1000) : 0;
        const avgTime = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + (h.timeSpent || 0), 0) / history.length) : 0;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Final Score:`, 25, 135);
        doc.setFont(undefined, 'bold');
        doc.text(`${score} / ${MAX_QUESTIONS}`, 60, 135);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Result:`, 25, 145);
        if (isViolation) {
            doc.setTextColor(220, 53, 69);
            doc.setFont(undefined, 'bold');
            doc.text(`DISQUALIFIED`, 60, 145);
        } else {
            doc.setTextColor(40, 167, 69);
            doc.setFont(undefined, 'bold');
            doc.text(`COMPLETED`, 60, 145);
        }
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');

        doc.text(`Total Duration:`, 110, 135);
        doc.text(`${formatTime(totalSeconds)}`, 145, 135);
        
        doc.text(`Avg. Time / Q:`, 110, 145);
        doc.text(`${avgTime} seconds`, 145, 145);
        
        if (isViolation) {
            doc.setTextColor(220, 53, 69);
            doc.setFontSize(10);
            doc.text(`Reason: ${violationReason}`, 25, 155, { maxWidth: pageWidth - 50 });
            doc.setTextColor(0, 0, 0);
        }
        
        let yPos = 175;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("QUESTION-BY-QUESTION ANALYSIS", 20, yPos);
        doc.rect(20, yPos + 3, pageWidth - 40, 0.5, 'F');
        yPos += 15;
        
        history.forEach((item, index) => {
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${item.question}`, 20, yPos, { maxWidth: pageWidth - 40 });
            yPos += doc.splitTextToSize(item.question, pageWidth - 40).length * 7;
            
            doc.setFont(undefined, 'normal');
            doc.text(`Your Answer: ${item.selected || 'No Answer'}`, 25, yPos);
            doc.setFont(undefined, 'bold');
            doc.text(`Correct: ${item.correct}`, 100, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(`Time: ${item.timeSpent || 0}s`, 170, yPos);
            yPos += 8;
            
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            const exp = `Explanation: ${item.explanation}`;
            doc.text(exp, 25, yPos, { maxWidth: pageWidth - 50 });
            yPos += doc.splitTextToSize(exp, pageWidth - 50).length * 6 + 10;
            doc.setTextColor(0, 0, 0);
        });
        
        doc.save(`${decodeURIComponent(subject)}_Report.pdf`);
    };

    const handleNextLevel = async () => {
        try {
            setLoading(true);
            // Record current question result before moving
            let isCurrentCorrect = false;
            let currentFeedback = "Wait for next question...";
            const currentAnswer = vivaMode ? (vivaAnswer || "No verbal response provided") : selectedOption;

            if (question) {
                if (vivaMode && vivaAnswer) {
                    // Call backend for AI evaluation
                    try {
                        const response = await fetch('http://127.0.0.1:8000/evaluate-viva', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                question: question.problem_statement || question.question,
                                ideal_answer: question.explanation || "N/A",
                                student_answer: vivaAnswer
                            })
                        });
                        const evaluation = await response.json();
                        isCurrentCorrect = evaluation.is_correct;
                        currentFeedback = evaluation.feedback;
                    } catch (err) {
                        console.error("Evaluation failed:", err);
                        isCurrentCorrect = false; // Fallback to fail if error
                        currentFeedback = "Evaluation service unavailable.";
                    }
                } else if (vivaMode) {
                    // No answer provided in Viva mode
                    isCurrentCorrect = false;
                    currentFeedback = "No verbal response was provided for this question.";
                } else if (!quizMode && !vivaMode) {
                    // Coding mode evaluation: if at least one testcase is passed, mark as correct to award score credit
                    const anyPassed = testResults && Array.isArray(testResults) && testResults.length > 0 && testResults.some(r => r.passed);
                    isCurrentCorrect = anyPassed;
                    currentFeedback = anyPassed 
                        ? `Passed ${testResults.filter(r => r.passed).length} of ${testResults.length} test cases.` 
                        : "All test cases failed. Please review your code logic.";
                } else {
                    // MCQ mode
                    isCurrentCorrect = selectedOption === question.output_format;
                    currentFeedback = question.explanation || "No explanation provided.";
                }

                const timeTaken = Math.floor((Date.now() - qStartTime) / 1000);
                const result = {
                    question: question.problem_statement || question.question || "Unknown Question",
                    selected: currentAnswer,
                    correct: question.output_format || "N/A (Viva)",
                    isCorrect: isCurrentCorrect,
                    explanation: currentFeedback,
                    timeSpent: timeTaken
                };
                
                const newHistory = [...history, result];
                setHistory(newHistory);
                setTotalAttempted(newHistory.length);
                if (isCurrentCorrect) setScore(prev => prev + 1);

                // Reset per-question state
                setVivaAnswer('');
                setSelectedOption(null);
                setQStartTime(Date.now());

                // --- Backend Sync ---
                if (sessionId) {
                    try {
                        await fetch('http://127.0.0.1:8000/sessions/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_id: sessionId,
                                current_score: isCurrentCorrect ? score + 1 : score,
                                questions_attempted: newHistory.length,
                                history: newHistory
                            })
                        });
                    } catch (err) {
                        console.error("Session sync failed:", err);
                    }
                }
                // --------------------

                const nextCount = newHistory.length;
                if (nextCount < MAX_QUESTIONS) {
                    if (isProgressive) {
                        const difficultyLevels = ['Basic', 'Easy', 'Medium', 'Hard'];
                        const currentIdx = difficultyLevels.indexOf(difficulty);
                        const progressInterval = quizMode ? 6 : (vivaMode ? 4 : 1);
                        
                        if (nextCount % progressInterval === 0 && currentIdx < difficultyLevels.length - 1) {
                            const nextLevel = difficultyLevels[currentIdx + 1];
                            setDifficulty(nextLevel);
                            await generateQuestion(nextLevel);
                        } else {
                            await generateQuestion(difficulty);
                        }
                    } else {
                        await generateQuestion(difficulty);
                    }
                } else {
                    finishSession(currentAnswer);
                }
            }
        } catch (error) {
            console.error("Navigation error:", error);
            alert("Error moving to next question. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Fullscreen Gate ─────────────────────────────────────────────────────────
    // Browsers REQUIRE a user gesture (click) to enter fullscreen.
    // We check if fullscreen ACTUALLY succeeded before allowing the exam to start.
    if (!examReady) {
        const handleEnterExam = () => {
            const elem = document.documentElement;
            const req = elem.requestFullscreen
                || elem.webkitRequestFullscreen
                || elem.mozRequestFullScreen
                || elem.msRequestFullscreen;

            if (!req) {
                setFsError('❌ Your browser strictly blocks the Fullscreen API. The exam cannot start unless it is in full-screen mode. Please try using a modern browser like Chrome or Edge.');
                return;
            }

            setFsLoading(true);
            setFsError('');

            // Call requestFullscreen synchronously within the click call stack
            const promise = req.call(elem);
            if (promise && typeof promise.then === 'function') {
                promise.then(() => {
                    const isApiFS = !!(document.fullscreenElement
                        || document.webkitFullscreenElement
                        || document.mozFullScreenElement
                        || document.msFullscreenElement);
                    const isF11FS = window.matchMedia('(display-mode: fullscreen)').matches || Math.abs(window.screen.height - window.innerHeight) <= 3;
                    const isNowFullscreen = isApiFS || isF11FS;

                    if (isNowFullscreen) {
                        setIsFullscreen(true);
                        setExamReady(true);
                    } else {
                        setFsError('❌ Fullscreen was not granted. Please click the button again and select "Allow" when your browser asks for permission.');
                    }
                    setFsLoading(false);
                }).catch(e => {
                    console.warn('Fullscreen request failed:', e);
                    setFsLoading(false);
                    if (e.name === 'NotAllowedError') {
                        setFsError('❌ Fullscreen was blocked by your browser. Please click the address bar area, then try again. Or press F11 to manually enter fullscreen.');
                    } else {
                        setFsError(`❌ Fullscreen failed: ${e.message}. Try pressing F11 to enter fullscreen manually, then click the button.`);
                    }
                });
            } else {
                // Older browsers/environments that execute synchronously
                setIsFullscreen(true);
                setExamReady(true);
                setFsLoading(false);
            }
        };

        const handleF11Fallback = () => {
            // If user pressed F11 manually, they may be in fullscreen now — check and proceed
            const isApiFS = !!(document.fullscreenElement
                || document.webkitFullscreenElement
                || document.mozFullScreenElement
                || document.msFullscreenElement);
            const isF11FS = window.matchMedia('(display-mode: fullscreen)').matches || Math.abs(window.screen.height - window.innerHeight) <= 3;
            const isNowFullscreen = isApiFS || isF11FS;
            if (isNowFullscreen) {
                setIsFullscreen(true);
                setExamReady(true);
            } else {
                setFsError('❌ Not in fullscreen yet. Press F11 first to go fullscreen, then click this button.');
            }
        };

        return html`
            <div style=${{  
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                padding: '2rem'
            }}>
                <div style=${{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: '24px',
                    padding: '3.5rem',
                    maxWidth: '560px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.4)'
                }}>
                    <div style=${{
                        width: '80px', height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(37,99,235,0.12)',
                        border: '2px solid rgba(37,99,235,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.5rem',
                        margin: '0 auto 2rem'
                    }}>🖥️</div>

                    <h1 style=${{ fontSize: '2rem', color: 'var(--primary-accent)', marginBottom: '0.75rem' }}>
                        ${decodeURIComponent(subject || 'Exam')}
                    </h1>
                    <p style=${{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        ${(initialMode || 'mcq').toUpperCase()} Mode
                    </p>

                    <div style=${{
                        background: 'rgba(37,99,235,0.06)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        borderRadius: '14px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <p style=${{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>📋 Exam Rules</p>
                        <ul style=${{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.9', paddingLeft: '1.2rem' }}>
                            <li>The exam <strong>must run in fullscreen</strong> at all times.</li>
                            <li>Do <strong>not switch tabs</strong> or minimize the window.</li>
                            <li>Keep your <strong>face visible</strong> to the camera.</li>
                            <li>Maintain <strong>absolute silence</strong> during the exam.</li>
                            <li>5 violations will <strong>automatically terminate</strong> the exam.</li>
                        </ul>
                    </div>

                    ${fsError ? html`
                        <div style=${{
                            background: 'rgba(220,53,69,0.08)',
                            border: '1px solid rgba(220,53,69,0.3)',
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            marginBottom: '1.25rem',
                            fontSize: '0.85rem',
                            color: '#f87171',
                            lineHeight: '1.6',
                            textAlign: 'left'
                        }}>${fsError}</div>
                    ` : ''}

                    <button
                        id="enter-fullscreen-btn"
                        onClick=${handleEnterExam}
                        disabled=${fsLoading}
                        style=${{
                            width: '100%',
                            padding: '1rem 2rem',
                            background: fsLoading ? '#334155' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            cursor: fsLoading ? 'wait' : 'pointer',
                            letterSpacing: '0.04em',
                            boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                            transition: 'all 0.2s ease',
                            opacity: fsLoading ? 0.7 : 1
                        }}
                    >
                        ${fsLoading ? '⏳ Requesting fullscreen...' : '🖥️  Enter Fullscreen & Start Exam'}
                    </button>

                    <button
                        onClick=${handleF11Fallback}
                        style=${{
                            width: '100%',
                            marginTop: '0.75rem',
                            padding: '0.75rem 2rem',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ⌨️ I pressed F11 manually — Start Exam
                    </button>

                    <p style=${{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1rem' }}>
                        If blocked, press <strong>F11</strong> on your keyboard to go fullscreen, then click the button above.
                    </p>
                </div>
            </div>
        `;
    }

    if (showReport) {
        return html`
            <div className="container animate-fade" style=${{padding: '4rem 0'}}>
                <div className="glass" style=${{padding: '3rem', maxWidth: '1000px', margin: '0 auto'}}>
                    <div style=${{textAlign: 'center', marginBottom: '4rem'}}>
                        <h1 style=${{marginBottom: '0.5rem', fontSize: '2.5rem', color: 'var(--primary-accent)'}}>Performance Report</h1>
                        <p style=${{color: 'var(--text-muted)', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '2px'}}>Official Assessment Record</p>
                        
                        <!-- Candidate Information Section -->
                        <div className="glass" style=${{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                            padding: '2rem',
                            marginBottom: '3rem',
                            textAlign: 'left',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-dim)'
                        }}>
                            <div>
                                <div style=${{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>Candidate Name</div>
                                <div style=${{fontSize: '1.1rem', fontWeight: '600'}}>${userData?.name || 'Unknown Candidate'}</div>
                            </div>
                            <div>
                                <div style=${{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>Subject</div>
                                <div style=${{fontSize: '1.1rem', fontWeight: '600'}}>${decodeURIComponent(subject)}</div>
                            </div>
                            <div>
                                <div style=${{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>Start Time</div>
                                <div style=${{fontSize: '1.1rem', fontWeight: '600'}}>${examStartTime ? examStartTime.toLocaleString() : 'N/A'}</div>
                            </div>
                            <div>
                                <div style=${{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>End Time</div>
                                <div style=${{fontSize: '1.1rem', fontWeight: '600'}}>${examEndTime ? examEndTime.toLocaleString() : new Date().toLocaleString()}</div>
                            </div>
                        </div>

                        <div style=${{
                            background: 'rgba(225, 29, 72, 0.05)',
                            padding: '2rem',
                            borderRadius: '24px',
                            display: 'inline-block',
                            border: '1px solid var(--primary-accent-glow)',
                            marginBottom: '1.5rem'
                        }}>
                            <div style=${{fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Final Score</div>
                            <div style=${{fontSize: '5rem', fontWeight: '900', color: isViolation ? '#dc3545' : 'var(--primary-accent)', lineHeight: '1'}}>
                                ${isViolation ? '!' : `${score} / ${MAX_QUESTIONS}`}
                            </div>
                        </div>
                        <p style=${{fontSize: '1.2rem', color: isViolation ? '#dc3545' : 'var(--text-secondary)', fontWeight: isViolation ? 'bold' : 'normal', maxWidth: '600px', margin: '0 auto'}}>
                            ${isViolation ? `VIOLATION DETECTED: ${violationReason}` : (score >= MAX_QUESTIONS * 0.8 ? 'Outstanding Performance! You have mastered this subject.' : 'Good job! Keep practicing to improve your score.')}
                        </p>

                        <div className="grid" style=${{gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2.5rem', maxWidth: '500px', margin: '2.5rem auto 0'}}>
                            <div className="glass" style=${{padding: '1.5rem', background: 'rgba(40,167,69,0.05)', borderColor: 'rgba(40,167,69,0.2)'}}>
                                <div style=${{fontSize: '0.8rem', color: '#28a745', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>Correct Ans</div>
                                <div style=${{fontSize: '2rem', fontWeight: '900', color: '#28a745'}}>${history.filter(h => h.isCorrect).length}</div>
                            </div>
                            <div className="glass" style=${{padding: '1.5rem', background: 'rgba(220,53,69,0.05)', borderColor: 'rgba(220,53,69,0.2)'}}>
                                <div style=${{fontSize: '0.8rem', color: '#dc3545', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold'}}>Wrong Ans</div>
                                <div style=${{fontSize: '2rem', fontWeight: '900', color: '#dc3545'}}>${history.length - history.filter(h => h.isCorrect).length}</div>
                            </div>
                        </div>

                        <div style=${{marginTop: '2.5rem'}}>
                            <button onClick=${downloadPDF} className="btn btn-primary" style=${{padding: '12px 30px', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(37,99,235,0.3)'}}>
                                <span>📄</span> Download Report (PDF)
                            </button>
                        </div>
                    </div>

                    <div style=${{marginBottom: '1.5rem'}}>
                        <h3 style=${{fontSize: '1.5rem'}}>Review Summary</h3>
                    </div>

                    <div style=${{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem'}}>
                        ${history.map((item, index) => html`
                            <div className="glass" style=${{padding: '1.5rem', borderLeft: `6px solid ${item.isCorrect ? '#28a745' : '#dc3545'}`, background: 'rgba(255,255,255,0.02)'}}>
                                <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                                    <span style=${{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Question ${index + 1} (${item.timeSpent}s spent)</span>
                                    <span style=${{color: item.isCorrect ? '#28a745' : '#dc3545', fontWeight: 'bold'}}>
                                        ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                </div>
                                <p style=${{fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '500'}}>${item.question}</p>
                                <div style=${{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem'}}>
                                    <div className="glass" style=${{padding: '0.75rem', background: item.isCorrect ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)'}}>
                                        <span style=${{display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Your Answer</span>
                                        <span style=${{fontWeight: '600'}}>${item.selected || 'No Answer'}</span>
                                    </div>
                                    <div className="glass" style=${{padding: '0.75rem', background: 'rgba(40,167,69,0.1)'}}>
                                        <span style=${{display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Correct Answer</span>
                                        <span style=${{fontWeight: '600'}}>${item.correct}</span>
                                    </div>
                                </div>
                                <p style=${{fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                    <strong style=${{color: 'var(--text-primary)'}}>Explanation: </strong> ${item.explanation}
                                </p>
                            </div>
                        `)}
                    </div>

                    <div className="glass" style=${{
                        padding: '2.5rem', 
                        marginBottom: '3rem', 
                        textAlign: 'center',
                        background: 'linear-gradient(145deg, rgba(225, 29, 72, 0.05), rgba(0, 0, 0, 0))'
                    }}>
                        <h2 style=${{marginBottom: '1rem'}}>Rate Your Exam Experience</h2>
                        <p style=${{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>How was your session today?</p>
                        <div style=${{fontSize: '3rem', display: 'flex', justifyContent: 'center', gap: '10px'}}>
                            ${[1, 2, 3, 4, 5].map(star => html`
                                <span 
                                    onClick=${() => setStudentRating(star)}
                                    style=${{
                                        cursor: 'pointer', 
                                        color: star <= studentRating ? '#ffc107' : 'var(--text-muted)',
                                        transition: 'transform 0.2s ease',
                                        transform: star === studentRating ? 'scale(1.2)' : 'scale(1)',
                                        border: '1px solid transparent', // for layout
                                        fontSize: '4rem',
                                        opacity: star <= studentRating ? 1 : 0.3
                                    }}
                                    onMouseOver=${(e) => e.target.style.transform = 'scale(1.2)'}
                                    onMouseOut=${(e) => e.target.style.transform = star === studentRating ? 'scale(1.2)' : 'scale(1)'}
                                >
                                    ${star <= studentRating ? '★' : '★'}
                                </span>
                            `)}
                        </div>
                        ${studentRating > 0 ? html`
                            <p className="animate-fade" style=${{marginTop: '1rem', color: 'var(--primary-accent)', fontWeight: '600'}}>
                                Thank you for your feedback!
                            </p>
                        ` : ''}
                    </div>

                    <div style=${{textAlign: 'center', marginTop: '2rem'}}>
                        <div className="animate-fade" style=${{marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                            <div style=${{width: '50px', height: '50px', borderRadius: '50%', background: isViolation ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)', color: isViolation ? '#dc3545' : '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.5rem'}}>
                                ${isViolation ? '!' : '✓'}
                            </div>
                            <h3 style=${{fontSize: '1.25rem', color: isViolation ? '#dc3545' : '#28a745'}}>${isViolation ? 'Session Terminated' : 'Exam Submitted Successfully'}</h3>
                            <p style=${{color: 'var(--text-secondary)', fontSize: '0.95rem'}}>${isViolation ? 'A security violation was recorded.' : 'Your results have been recorded.'}</p>
                        </div>

                        <button onClick=${() => navigate('/dashboard')} className="btn btn-primary">Return to Dashboard</button>
                    </div>
                </div>
            </div>
        `;
    }

    return html`
        <div className="container animate-fade" style=${{paddingTop: '2rem'}}>

        ${showWarning ? html`
            <div style=${{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease'
            }}>
                <div style=${{
                    background: 'linear-gradient(145deg, #1a0a0a, #0d0d0d)',
                    border: warningMessage.isInfoOnly ? '2px solid #0dcaf0' : '2px solid #dc3545',
                    borderRadius: '16px',
                    padding: '2.5rem 3rem',
                    maxWidth: '480px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: warningMessage.isInfoOnly ? '0 0 40px rgba(13,202,240,0.4), 0 20px 60px rgba(0,0,0,0.6)' : '0 0 40px rgba(220,53,69,0.4), 0 20px 60px rgba(0,0,0,0.6)',
                    animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
                }}>
                    <div style=${{
                        width: '64px', height: '64px',
                        borderRadius: '50%',
                        background: warningMessage.isInfoOnly ? 'rgba(13,202,240,0.15)' : 'rgba(220,53,69,0.15)',
                        border: warningMessage.isInfoOnly ? '2px solid rgba(13,202,240,0.5)' : '2px solid rgba(220,53,69,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem',
                        margin: '0 auto 1.5rem'
                    }}>${warningMessage.isInfoOnly ? 'ℹ️' : '⚠️'}</div>

                    <div style=${{
                        fontSize: '0.75rem', fontWeight: '700',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: warningMessage.isInfoOnly ? '#0dcaf0' : '#dc3545', marginBottom: '0.5rem'
                    }}>${warningMessage.isInfoOnly ? 'Information' : 'Security Warning'}</div>

                    <h2 style=${{
                        fontSize: '1.5rem', fontWeight: '800',
                        color: '#fff', margin: '0 0 0.75rem'
                    }}>${warningMessage.reason}</h2>

                    <p style=${{
                        color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem',
                        lineHeight: '1.6', marginBottom: '1.75rem'
                    }}>
                        ${warningMessage.isInfoOnly ? 'Please adjust your position. This does not count as a warning.' : html`Please stay in fullscreen, do not switch tabs, and avoid any suspicious activities.<br/>After 5 warnings your exam will be <strong style=${{color:'#dc3545'}}>terminated</strong>.`}
                    </p>

                    ${warningMessage.isInfoOnly && warningMessage.reason.includes("Face not fully visible") ? html`
                        <div style=${{textAlign: 'left', marginBottom: '1.75rem', background: 'rgba(13,202,240,0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(13,202,240,0.2)'}}>
                            <h4 style=${{fontSize: '0.9rem', color: '#0dcaf0', marginBottom: '0.75rem', fontWeight: '700'}}>How to keep your face in frame:</h4>
                            <ul style=${{fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', paddingLeft: '1.2rem', lineHeight: '1.6'}}>
                                <li>Ensure your <strong>entire face</strong> is visible in the bottom-right camera preview.</li>
                                <li>Center yourself directly in front of the camera.</li>
                                <li>Make sure there is <strong>proper lighting</strong> on your face (avoid bright lights behind you).</li>
                                <li>Maintain a distance of about <strong>2 feet</strong> from the screen.</li>
                                <li>Avoid resting your chin on your hands or covering your mouth.</li>
                            </ul>
                        </div>
                    ` : ''}

                    ${!warningMessage.isInfoOnly ? html`
                    <div style=${{
                        display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem'
                    }}>
                        ${[1,2,3,4,5].map(i => html`
                            <div style=${{
                                width: '36px', height: '8px',
                                borderRadius: '4px',
                                background: i <= warningMessage.count
                                    ? (warningMessage.count === 5 ? '#dc3545' : warningMessage.count >= 3 ? '#fd7e14' : '#ffc107')
                                    : 'rgba(255,255,255,0.1)',
                                transition: 'background 0.3s ease'
                            }}></div>
                        `)}
                    </div>

                    <div style=${{fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem'}}>
                        Warning ${warningMessage.count} of 5
                    </div>
                    ` : ''}

                    <button
                        onClick=${dismissWarning}
                        style=${{
                            background: warningMessage.isInfoOnly ? 'linear-gradient(135deg, #0dcaf0, #0bacbe)' : 'linear-gradient(135deg, #dc3545, #c82333)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.9rem 2.5rem',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            width: '100%',
                            letterSpacing: '0.04em',
                            boxShadow: warningMessage.isInfoOnly ? '0 4px 20px rgba(13,202,240,0.4)' : '0 4px 20px rgba(220,53,69,0.4)',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseOver=${e => e.target.style.transform='scale(1.02)'}
                        onMouseOut=${e => e.target.style.transform='scale(1)'}
                    >
                        I Understand — Return to Exam
                    </button>
                </div>
            </div>
        ` : ''}

            ${!isFullscreen && examReady && !showReport && !isDebug ? html`
                <div style=${{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.95)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    textAlign: 'center',
                    padding: '2rem',
                    backdropFilter: 'blur(15px)'
                }}>
                    <div style=${{fontSize: '5rem', marginBottom: '1.5rem'}}>🖥️</div>
                    <h2 style=${{fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800'}}>Lockdown Mode Required</h2>
                    <p style=${{fontSize: '1.2rem', marginBottom: '3rem', color: '#cbd5e1', maxWidth: '600px', lineHeight: '1.6'}}>
                        This exam is strictly proctored and requires <strong>Fullscreen Mode</strong> to continue. 
                        Please click the button below to reactivate the secure environment.
                    </p>
                    <button 
                        onClick=${enterFullscreen}
                        style=${{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            padding: '1.2rem 4rem',
                            borderRadius: '16px',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 20px 40px rgba(37,99,235,0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                        onMouseOver=${(e) => {
                            e.target.style.transform = 'translateY(-4px) scale(1.02)';
                            e.target.style.boxShadow = '0 25px 50px rgba(37,99,235,0.5)';
                        }}
                        onMouseOut=${(e) => {
                            e.target.style.transform = 'translateY(0) scale(1)';
                            e.target.style.boxShadow = '0 20px 40px rgba(37,99,235,0.3)';
                        }}
                    >
                        Reactivate Fullscreen
                    </button>
                    <p style=${{marginTop: '3rem', fontSize: '1rem', color: '#94a3b8'}}>
                        Alternatively, press <strong>F11</strong> on your keyboard, then click the button.
                    </p>
                </div>
            ` : ''}
            <button className="btn btn-outline btn-back" onClick=${() => window.history.back()}>
                ← Back to Dashboard
            </button>
            <div style=${{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <div>
                    <h2 style=${{fontSize: '2rem'}}>${decodeURIComponent(subject || 'Subject')}</h2>
                    <p style=${{color: 'var(--primary-accent)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                        ${initialMode ? `${initialMode} Session` : `${quizMode ? 'QUIZ' : 'CODING'} ${vivaMode ? '+ VIVA' : ''}`}
                    </p>
                </div>
                
                ${(!question && !showReport) ? html`
                <div style=${{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    ${!initialMode ? html`
                        <div className="glass" style=${{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style=${{fontSize: '0.8rem'}}>Programming</span>
                            <input type="checkbox" checked=${!quizMode && !vivaMode} onChange=${() => { setQuizMode(false); setVivaMode(false); }} />
                        </div>

                        <div className="glass" style=${{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style=${{fontSize: '0.8rem'}}>MCQ Mode</span>
                            <input type="checkbox" checked=${quizMode} onChange=${(e) => { setQuizMode(e.target.checked); if(e.target.checked) setVivaMode(false); }} />
                        </div>
                        
                        <div className="glass" style=${{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style=${{fontSize: '0.8rem'}}>Viva</span>
                            <input type="checkbox" checked=${vivaMode} onChange=${(e) => { setVivaMode(e.target.checked); if(e.target.checked) setQuizMode(false); }} />
                        </div>
                    ` : ''}

                    <select value=${difficulty} onChange=${(e) => setDifficulty(e.target.value)} className="glass" style=${{padding: '0.5rem', minWidth: '120px'}} disabled=${vivaMode}>
                        ${levels.map(l => html`<option value=${l}>${l}</option>`)}
                    </select>
                </div>
                ` : ''}
            </div>

            ${question ? html`
                <div className="question-container" style=${{
                    gridTemplateColumns: quizMode ? '1fr' : '1fr 1fr',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                }}>
                    <div className=${`panel glass ${isSpeaking ? 'speaking-pulse' : ''}`}>
                        <div style=${{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style=${{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                <span className=${`difficulty-badge ${question.difficulty}`}>${question.difficulty}</span>
                                <div className="glass" style=${{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: timeLeft < 60 ? '#dc3545' : 'var(--border-dim)'}}>
                                    <span style=${{fontSize: '1.2rem'}}>⏱️</span>
                                    <span style=${{fontWeight: '800', fontFamily: 'monospace', fontSize: '1.1rem', color: timeLeft < 60 ? '#dc3545' : 'var(--primary-accent)'}}>
                                        ${formatTime(timeLeft)}
                                    </span>
                                </div>
                                ${!isFullscreen && html`
                                    <button 
                                        onClick=${enterFullscreen}
                                        className="animate-pulse"
                                        style=${{
                                            background: 'rgba(225, 29, 72, 0.1)',
                                            border: '1px solid var(--primary-accent)',
                                            color: 'var(--primary-accent)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span>🖥️</span> Enable Fullscreen
                                    </button>
                                `}
                            </div>
                            <div style=${{textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                <p style=${{color: 'var(--primary-accent)', fontWeight: 'bold', fontSize: '1.1rem', margin: 0}}>Question ${history.length + 1} / ${MAX_QUESTIONS}</p>
                                <button onClick=${() => { enterFullscreen(); finishSession(); }} className="btn btn-outline" style=${{borderColor: '#28a745', color: '#28a745', padding: '0.4rem 1rem', fontSize: '0.9rem', borderRadius: '8px', background: 'rgba(40,167,69,0.1)'}}>
                                    Submit Exam
                                </button>
                            </div>
                        </div>
                        
                        <h3 style=${{marginTop: '1.5rem', marginBottom: '1rem'}}>${(quizMode || (vivaMode && !question.problem_statement)) ? 'Question' : 'Problem Statement'}</h3>
                        <p style=${{fontSize: '1.2rem'}}>${question.question || question.problem_statement}</p>
                        
                        ${(!quizMode && !vivaMode && question.sample_io) ? html`
                            <div style=${{marginTop: '1.5rem'}}>
                                <h4 style=${{fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem'}}>Sample I/O</h4>
                                <pre className="glass" style=${{padding: '1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-dim)', borderRadius: '8px', whiteSpace: 'pre-wrap'}}>${question.sample_io}</pre>
                            </div>
                        ` : ''}

                        ${vivaMode ? html`
                            <div className="glass" style=${{marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.02)'}}>
                                <div style=${{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                    <h4 style=${{color: 'var(--text-secondary)'}}>Your Verbal Response</h4>
                                    <button 
                                        onClick=${toggleListening} 
                                        className=${`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
                                        style=${{padding: '8px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px'}}
                                    >
                                        <span style=${{fontSize: '1.2rem'}}>${isListening ? '⏹️' : '🎤'}</span>
                                        ${isListening ? 'Stop Listening' : 'Start Speaking'}
                                    </button>
                                </div>
                                <textarea 
                                    className="glass"
                                    value=${vivaAnswer}
                                    readOnly=${true}
                                    placeholder="Click 'Start Speaking' and state your answer clearly..."
                                    style=${{
                                        width: '100%', 
                                        minHeight: '150px', 
                                        background: 'rgba(0,0,0,0.2)', 
                                        border: isListening ? '2px solid var(--primary-accent)' : '1px solid var(--border-dim)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        color: '#fff',
                                        fontSize: '1.1rem',
                                        lineHeight: '1.6',
                                        resize: 'none'
                                    }}
                                ></textarea>
                                ${isListening && html`<p className="animate-pulse" style=${{marginTop: '1rem', color: 'var(--primary-accent)', fontSize: '0.9rem', textAlign: 'center'}}>Listening to your voice...</p>`}
                            </div>
                        ` : (quizMode ? html`
                            <div style=${{marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                ${shuffledOptions.map(opt => html`
                                    <button 
                                        onClick=${() => handleOptionSelect(opt)}
                                        className="glass"
                                        style=${{
                                            padding: '1.75rem 2rem', 
                                            textAlign: 'left', 
                                            color: 'var(--text-primary)', 
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1.1rem',
                                            borderColor: opt === selectedOption ? 'var(--primary-accent)' : 'var(--border-dim)',
                                            background: opt === selectedOption ? 'rgba(225, 29, 72, 0.1)' : 'var(--bg-card)'
                                        }}
                                    >
                                        ${opt}
                                    </button>
                                `)}
                            </div>
                        ` : '')}


                        
                        <div style=${{marginTop: '2.5rem', display: 'flex', justifyContent: 'center'}}>
                            <button 
                                onClick=${() => {
                                    enterFullscreen();
                                    handleNextLevel();
                                }} 
                                className="btn btn-primary" 
                                style=${{padding: '1rem 2rem', width: '100%'}}
                                disabled=${loading || (quizMode && !selectedOption)}
                            >
                                ${loading ? 'Preparing...' : (history.length + 1 >= MAX_QUESTIONS ? 'Submit Exam \u2713' : 'Next Question \u203A')}
                            </button>
                        </div>
                    </div>
                    
                    ${(!quizMode && !vivaMode) ? html`
                        <div className="editor-panel glass" style=${{display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'}}>
                            <div style=${{padding: '1rem', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)'}}>
                                <div style=${{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div style=${{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <span style=${{color: 'var(--primary-accent)', fontSize: '1.2rem'}}>💻</span>
                                        <span style=${{fontWeight: '700', letterSpacing: '0.5px'}}>Jarvis IDE v3.0</span>
                                    </div>
                                    <button 
                                        onClick=${runCode} 
                                        disabled=${runningCode}
                                        className="btn btn-primary" 
                                        style=${{padding: '6px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)', borderRadius: '8px'}}
                                    >
                                        <span>${runningCode ? '⏳' : '▶'}</span> ${runningCode ? 'Running...' : 'Run & Verify'}
                                    </button>
                                </div>
                                <div style=${{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <span style=${{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold'}}>Language:</span>
                                    <select 
                                        value=${language} 
                                        onChange=${(e) => {
                                            const newLang = e.target.value;
                                            setLanguage(newLang);
                                            if (!code || Object.values(LANGUAGE_TEMPLATES).includes(code) || code === '// Write your solution here...') {
                                                setCode(LANGUAGE_TEMPLATES[newLang] || '');
                                            }
                                        }} 
                                        className="glass" 
                                        style=${{
                                            padding: '4px 12px', 
                                            fontSize: '0.85rem', 
                                            borderRadius: '8px', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-dim)',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ${languages.map(lang => html`<option value=${lang} style=${{background: '#1e293b'}}>${lang}</option>`)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style=${{flex: 1, overflow: 'hidden', position: 'relative', background: '#1e1e1e'}}>
                                <${Editor.default || Editor} 
                                    height="100%" 
                                    language=${language.toLowerCase() === 'c++' ? 'cpp' : language.toLowerCase()} 
                                    theme="vs-dark" 
                                    value=${code} 
                                    onChange=${(val) => setCode(val || '')} 
                                    options=${{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                        padding: { top: 16 }
                                    }}
                                />
                            </div>
                            
                            ${(testResults && Array.isArray(testResults)) ? html`
                                <div className="results-panel" style=${{padding: '1.25rem', borderTop: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.5)', maxHeight: '250px', overflowY: 'auto'}}>
                                    <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center'}}>
                                        <h4 style=${{fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <span style=${{color: 'var(--primary-accent)'}}>📊</span> Execution Summary
                                        </h4>
                                        <span style=${{
                                            fontSize: '0.85rem', 
                                            fontWeight: 'bold',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: testResults.length > 0 && testResults.some(r => r.passed) ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: testResults.length > 0 && testResults.some(r => r.passed) ? '#22c55e' : '#ef4444'
                                        }}>
                                            ${testResults.filter(r => r.passed).length} / ${testResults.length} Test Cases Passed
                                        </span>
                                    </div>
                                    <div style=${{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                                        ${testResults.map((res, i) => html`
                                            <div key=${i} style=${{
                                                padding: '1rem', 
                                                borderRadius: '12px', 
                                                background: res.passed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                                                border: `1px solid ${res.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                                fontSize: '0.85rem'
                                            }}>
                                                <div style=${{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                                    <span style=${{fontWeight: '700', color: 'var(--text-primary)'}}>Test Case #${i + 1}</span>
                                                    <span style=${{color: res.passed ? '#22c55e' : '#ef4444', fontWeight: 'bold'}}>${res.passed ? 'PASSED ✓' : 'FAILED ✗'}</span>
                                                </div>
                                                ${!res.passed && html`
                                                    <div style=${{marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
                                                        <div style=${{color: 'var(--text-secondary)'}}>Input: <code style=${{color: '#f8fafc', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px'}}>${res.input}</code></div>
                                                        <div style=${{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem'}}>
                                                            <div style=${{color: 'var(--text-secondary)'}}>Expected: <code style=${{color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: '4px'}}>${res.expected}</code></div>
                                                            <div style=${{color: 'var(--text-secondary)'}}>Actual: <code style=${{color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px'}}>${res.actual || 'No output'}</code></div>
                                                        </div>
                                                        ${res.error && html`
                                                            <div style=${{marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)'}}>
                                                                <div style=${{color: '#ef4444', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.75rem'}}>Runtime Error / Traceback:</div>
                                                                <pre style=${{margin: 0, color: '#fca5a5', whiteSpace: 'pre-wrap', fontSize: '0.75rem', fontFamily: 'monospace'}}>${res.error}</pre>
                                                            </div>
                                                        `}
                                                    </div>
                                                `}
                                            </div>
                                        `)}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>


            ` : html`
                <div className="glass animate-fade" style=${{padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
                    <h2 style=${{fontSize: '2rem', marginBottom: '1rem'}}>Exam Setup</h2>
                    <p style=${{color: 'var(--text-secondary)', marginBottom: '3rem'}}>Configure your session requirements before beginning.</p>

                    <div style=${{marginBottom: '3rem'}}>
                        <h4 style=${{textAlign: 'left', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Select Difficulty</h4>
                        <div style=${{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                            ${levels.map(l => html`
                                <div 
                                    onClick=${() => setDifficulty(l)}
                                    className="glass" 
                                    style=${{
                                        padding: '1.5rem 1rem', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        borderColor: l === difficulty ? 'var(--primary-accent)' : 'var(--border-dim)',
                                        background: l === difficulty ? 'rgba(225, 29, 72, 0.1)' : 'transparent',
                                        transform: l === difficulty ? 'translateY(-5px)' : 'none'
                                    }}
                                >
                                    <div style=${{fontWeight: 'bold', fontSize: '1.2rem', color: l === difficulty ? 'var(--primary-accent)' : 'var(--text-primary)'}}>${l}</div>
                                </div>
                            `)}
                        </div>
                    </div>

                    <div style=${{marginBottom: '4rem', textAlign: 'left'}}>
                        <h4 style=${{marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Difficulty Mode</h4>
                        <div style=${{display: 'flex', gap: '2rem'}}>
                            <label style=${{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                                <input type="radio" checked=${isProgressive} onChange=${() => setIsProgressive(true)} style=${{accentColor: 'var(--primary-accent)'}} />
                                <div>
                                    <div style=${{fontWeight: 'bold'}}>Progressive Challenge</div>
                                    <div style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Increases difficulty as you progress (6 questions per level)</div>
                                </div>
                            </label>
                            <label style=${{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                                <input type="radio" checked=${!isProgressive} onChange=${() => setIsProgressive(false)} style=${{accentColor: 'var(--primary-accent)'}} />
                                <div>
                                    <div style=${{fontWeight: 'bold'}}>Fixed Difficulty</div>
                                    <div style=${{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Stay at the selected level for the entire session</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick=${() => { 
                            // Request Fullscreen (Direct synchronous trigger)
                            enterFullscreen().then(success => {
                                if (success) {
                                    setLoading(true);
                                    setTimeout(() => generateQuestion(), 400);
                                } else {
                                    alert("Fullscreen could not be enabled. Please ensure you are not in a restricted browser mode and try again.");
                                }
                            });
                        }} 
                        className="btn btn-primary" 
                        style=${{padding: '1.25rem 4rem', fontSize: '1.1rem'}}
                        disabled=${loading}
                    >
                        ${loading ? 'Preparing Session...' : 'Start Examination'}
                    </button>
                    
                    <p style=${{marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                        🔒 Secure lockdown mode will be enabled upon starting.
                    </p>
                </div>
            `}
            
            ${question && !showReport ? html`
                <div style=${{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '160px',
                    height: '120px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid var(--primary-accent)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 9000,
                    background: '#000'
                }}>
                    <video 
                        ref=${videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        style=${{width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'}}
                    />
                    <div style=${{
                        position: 'absolute', bottom: '5px', left: '5px', 
                        background: 'rgba(0,0,0,0.6)', padding: '2px 6px', 
                        borderRadius: '4px', fontSize: '0.65rem', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <div style=${{width: '6px', height: '6px', borderRadius: '50%', background: aiModelsLoaded ? '#28a745' : '#dc3545'}}></div>
                        ${aiModelsLoaded ? 'Proctoring Active' : 'Loading AI...'}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
};

export default QuestionPage;
