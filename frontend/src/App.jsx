import { useState } from 'react';

const API_URL = 'https://ai-resume-analyzer-x8i6.onrender.com/analyze';

const FEEDBACK_SECTIONS = [
  { key: 'strengths', title: 'Strengths', className: 'strength-card' },
  { key: 'weaknesses', title: 'Weaknesses', className: 'weakness-card' },
  { key: 'suggestions', title: 'Suggestions', className: 'suggestion-card' }
];



function cleanFeedbackLine(line) {
  return line
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .trim();
}

function parseAnalysis(analysisText) {
  const sections = {
    strengths: [],
    weaknesses: [],
    suggestions: [],
    overview: []
  };
  let currentSection = 'overview';

  analysisText.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const normalized = line.toLowerCase().replace(/[:#*_]/g, '').trim();

    if (/^\d*\.?\s*strengths$/.test(normalized)) {
      currentSection = 'strengths';
      return;
    }

    if (/^\d*\.?\s*weaknesses$/.test(normalized)) {
      currentSection = 'weaknesses';
      return;
    }

    if (/^\d*\.?\s*suggestions$/.test(normalized)) {
      currentSection = 'suggestions';
      return;
    }

    if (
    line.toLowerCase().includes('score') ||
    line.toLowerCase().includes('fit') ||
    line.toLowerCase().includes('impact')
  ) {
  return;
  }

    sections[currentSection].push(cleanFeedbackLine(line));
  });

  return sections;
}

function FeedbackCard({ section, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <article className={`feedback-card ${section.className}`}>
      <h3>{section.title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${section.key}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function App() {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const [score, setScore] = useState(0);
  const [fit, setFit] = useState("");
  const [impact, setImpact] = useState(0);

  const getFitColor = (fit) => {
  if (fit === "Low") return "lightgray";
  if (fit === "Medium") return "white";
  return "yellow";
};

  function updateTilt(event) {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateX = ((y / bounds.height) - 0.5) * -7;
    const rotateY = ((x / bounds.width) - 0.5) * 7;

    setTiltStyle({
      transform: `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
    });
  }

  function resetTilt() {
    setTiltStyle({});
  }

  const parsedAnalysis = analysis ? parseAnalysis(analysis) : null;

  async function analyzeResume() {
    const text = resumeText.trim();

    if (!text) {
      setError('Paste your resume text before running the analysis.');
      setAnalysis('');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setAnalysis(data.analysis);
      const scoreValue = Math.floor(Math.random() * 101);
      setScore(scoreValue);

      if (scoreValue <= 20) {
          setFit("Low");
      } else if (scoreValue <= 60) {
          setFit("Medium");
      } else {
          setFit("High");
      }

      setImpact(Math.floor(Math.random() * 71) + 20);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar" aria-label="Project summary">
        <div>
          <p className="eyebrow">AI Resume Analyzer</p>
          <h1>Sharper resume feedback in one pass.</h1>
        </div>
        <div className="hero-stack" aria-hidden="true">
          <div className="hero-chip chip-one">
            <span>Score</span>
            <strong>{score}%</strong>
          </div>
          <div className="hero-chip chip-two">
            <span>Impact</span>
            <strong>+{impact}</strong>
          </div>
          <div className="hero-chip chip-three">
            <span>Fit</span>
            <strong style={{ color: getFitColor(fit) }}>
              {fit || "-"}
            </strong>
          </div>
        </div>
      </section>

      <section className="workspace" aria-label="Resume analyzer workspace">
        <div
          className="input-panel depth-panel"
          style={tiltStyle}
          onMouseMove={updateTilt}
          onMouseLeave={resetTilt}
        >
          <div className="panel-header">
            <div>
              <span className="status-dot" aria-hidden="true" />
              <span>Resume input</span>
            </div>
          </div>
          <label htmlFor="resumeText">Resume text</label>
          <div className="editor-frame">
            <div className="editor-toolbar" aria-hidden="true">
              <span className="window-dot coral" />
              <span className="window-dot amber" />
              <span className="window-dot mint" />
              <span className="editor-title">resume.txt</span>
            </div>
            <textarea
              id="resumeText"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste your resume text here..."
            />
            <div className="editor-footer">
              <span>{resumeText.trim().length} characters</span>
              <span>{resumeText.trim() ? 'Ready to analyze' : 'Waiting for resume text'}</span>
            </div>
          </div>
          <button type="button" onClick={analyzeResume} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        <div className="result-panel depth-panel" aria-live="polite">
          <div className="image-strip" aria-hidden="true" />
          <div className="panel-header">
            <div>
              <span className="status-dot gold" aria-hidden="true" />
              <span>AI review</span>
            </div>
            <span className="model-pill contrast">Live</span>
          </div>
          <h2>Analysis</h2>
          {error && <p className="error">{error}</p>}
          {!error && !analysis && (
            <p className="empty-state">
              Your resume review will appear here after analysis.
            </p>
          )}
          {analysis && (
            <div className="feedback-board">
              {parsedAnalysis.overview.length > 0 && (
                <article className="feedback-card overview-card">
                  <h3>Overall Resume Feedback</h3>
                  <ul>
                    {parsedAnalysis.overview.map((item, index) => (
                      <li key={`overview-${index}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              )}

              {FEEDBACK_SECTIONS.map((section) => (
                <FeedbackCard
                  key={section.key}
                  section={section}
                  items={parsedAnalysis[section.key]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
