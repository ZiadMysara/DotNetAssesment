import { useState, useMemo } from 'react'
import questions from './data/questions.json'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [revealedAnswers, setRevealedAnswers] = useState({})

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(questions.questions.map(q => q.category))]
    return ['All', ...cats.sort()]
  }, [])

  // Filter questions based on search and category
  const filteredQuestions = useMemo(() => {
    return questions.questions.filter(q => {
      const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory
      return matchesSearch && matchesCategory
    })
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

  const optionLetters = ['A', 'B', 'C', 'D']

  return (
    <div className="app">
      <div className="study-screen">
        <div className="container">
          {/* Header */}
          <header className="study-header">
            <div className="header-content">
              <div className="logo">💻</div>
              <h1>.NET Developer Study Guide</h1>
              <p className="subtitle">50 Technical Interview Questions</p>
            </div>
          </header>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search questions..."
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
                      {questions.questions.filter(q => q.category === cat).length}
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

              return (
                <div key={question.id} className="question-item card">
                  <div className="question-header">
                    <span className="question-number">#{question.id}</span>
                    <span className="category-badge">{question.category}</span>
                    {isRevealed && (
                      <button 
                        className="reset-btn"
                        onClick={() => resetRevealed(question.id)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  
                  <h3 className="question-text">{question.question}</h3>
                  
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
                          <span className="option-text">{option}</span>
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
