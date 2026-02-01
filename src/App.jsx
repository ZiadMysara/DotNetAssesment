import { useState, useMemo, useEffect } from 'react'
import questions from './data/questions.json'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Initialize from localStorage if available
  const [revealedAnswers, setRevealedAnswers] = useState(() => {
    const saved = localStorage.getItem('dotnet-quiz-progress')
    return saved ? JSON.parse(saved) : {}
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('dotnet-quiz-progress', JSON.stringify(revealedAnswers))
  }, [revealedAnswers])

  const resetAllProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      setRevealedAnswers({})
      localStorage.removeItem('dotnet-quiz-progress')
    }
  }

  // Get unique categories sorted by JSON order or alphabetically
  const categories = useMemo(() => {
    const cats = [...new Set(questions.questions.map(q => q.category || 'Other'))]
    
    if (questions.categoryOrder) {
      // Categories explicitly in order
      const ordered = questions.categoryOrder.filter(c => cats.includes(c))
      // Categories NOT in order (append alphabetically)
      const others = cats.filter(c => !questions.categoryOrder.includes(c)).sort()
      
      return ['All', ...ordered, ...others]
    }
    
    return ['All', ...cats.sort()]
  }, [])

  // Calculate global display IDs based on the "All" sorted order
  const displayIdMap = useMemo(() => {
    // 1. Get all questions with normalized category
    let all = questions.questions.map(q => ({
       ...q, 
       category: q.category || 'Other' 
    }))

    // 2. Sort them exactly how "All" view does
    if (questions.categoryOrder) {
      all.sort((a, b) => {
        const catA = a.category
        const catB = b.category
        if (catA === catB) return 0
        
        const indexA = questions.categoryOrder.indexOf(catA)
        const indexB = questions.categoryOrder.indexOf(catB)
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return catA.localeCompare(catB)
      })
    }
    
    // 3. Create map: realId -> displayIndex (1-based)
    const map = {}
    all.forEach((q, index) => {
      map[q.id] = index + 1
    })
    return map
  }, []) // Empty dependency array as questions.json is static

  // Filter and sort questions based on search and category
  const filteredQuestions = useMemo(() => {
    // 1. Normalize and Filter
    let result = questions.questions.map(q => ({
      ...q,
      category: q.category || 'Other'
    })).filter(q => {
      const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (q.code && q.code.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    // 2. Sort result if 'All' is selected and order exists
    if (selectedCategory === 'All' && questions.categoryOrder) {
      result.sort((a, b) => {
        const catA = a.category
        const catB = b.category
        
        if (catA === catB) return 0
        
        const indexA = questions.categoryOrder.indexOf(catA)
        const indexB = questions.categoryOrder.indexOf(catB)
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return catA.localeCompare(catB)
      })
    }
    
    return result
  }, [searchTerm, selectedCategory])

  const handleAnswerClick = (questionId, answerIndex) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const resetRevealed = (questionId) => {
    setRevealedAnswers(prev => {
      const newState = { ...prev }
      delete newState[questionId]
      return newState
    })
  }

  // Format inline code in text (backticks)
  const formatText = (text) => {
    if (!text) return text
    const parts = text.split(/(`[^`]+`)/)
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  const optionLetters = ['A', 'B', 'C', 'D']

  const getLanguageLabel = (lang) => {
    const labels = {
      'csharp': 'C#',
      'javascript': 'JavaScript',
      'sql': 'SQL',
      'html': 'HTML',
      'css': 'CSS'
    }
    return labels[lang] || lang?.toUpperCase() || 'CODE'
  }


  // Calculate progress
  const progressPercentage = Math.round((Object.keys(revealedAnswers).length / questions.questions.length) * 100)

  return (
    <div className="app">
      <div className="study-screen">
        <div className="container">
          {/* Header */}
          <header className="study-header">
            <div className="header-content">
              <div className="logo">💻</div>
              <h1>.NET Developer Study Guide</h1>
              <p className="subtitle">{questions.questions.length} Technical Interview Questions</p>
              
              <button className="reset-all-btn" onClick={resetAllProgress} title="Reset all answers">
                Reset All Progress ↺
              </button>
            </div>
          </header>

          {/* Sticky Progress Bar */}
          <div className="sticky-progress">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {progressPercentage}% Complete ({Object.keys(revealedAnswers).length}/{questions.questions.length})
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search questions or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => setSearchTerm('')}>×</button>
              )}
            </div>

            <div className="category-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== 'All' && (
                    <span className="category-count">
                      {questions.questions.filter(q => (q.category || 'Other') === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="results-info">
            Showing <strong>{filteredQuestions.length}</strong> of {questions.questions.length} questions
          </div>

          {/* Questions List */}
          <div className="questions-list">
            {filteredQuestions.map((question) => {
              const revealed = revealedAnswers[question.id]
              const isRevealed = revealed !== undefined
              // Use Display ID
              const displayId = displayIdMap[question.id] || question.id

              return (
                <div key={question.id} className="question-item card">
                  <div className="question-header">
                    <span className="question-number">#{displayId}</span>
                    <span className="category-badge">{question.category || 'Other'}</span>
                    {isRevealed && (
                      <button 
                        className="reset-btn"
                        onClick={() => resetRevealed(question.id)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  
                  <h3 className="question-text">{formatText(question.question)}</h3>
                  
                  {/* Code Block */}
                  {question.code && (
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">{getLanguageLabel(question.codeLanguage)}</span>
                      </div>
                      <pre className="code-content">
                        <code>{question.code}</code>
                      </pre>
                    </div>
                  )}
                  
                  <div className="options-grid">
                    {question.options.map((option, index) => {
                      let className = 'option-card'
                      
                      if (isRevealed) {
                        if (index === question.correctAnswer) {
                          className += ' correct'
                        } else if (index === revealed && index !== question.correctAnswer) {
                          className += ' incorrect'
                        } else {
                          className += ' faded'
                        }
                      }
                      
                      return (
                        <button
                          key={index}
                          className={className}
                          onClick={() => !isRevealed && handleAnswerClick(question.id, index)}
                          disabled={isRevealed}
                        >
                          <span className="option-letter">{optionLetters[index]}</span>
                          <span className="option-text">{formatText(option)}</span>
                          {isRevealed && index === question.correctAnswer && (
                            <span className="correct-icon">✓</span>
                          )}
                          {isRevealed && index === revealed && index !== question.correctAnswer && (
                            <span className="incorrect-icon">✗</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>No questions found</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
