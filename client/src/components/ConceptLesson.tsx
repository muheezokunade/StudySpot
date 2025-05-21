import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft, FiHelpCircle, FiCheck, FiX } from "react-icons/fi";

interface Exercise {
  id: number;
  question: string;
  type: "mcq" | "short_answer";
  options: string[] | null;
  correctAnswer: string;
  hint1: string;
  hint2: string;
  solution: string;
  memoryHook: string;
}

interface Navigation {
  previous: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
}

interface ConceptLessonProps {
  concept: {
    id: number;
    title: string;
    summary: string;
    pageSpan: string;
  };
  exercises: Exercise[];
  navigation: Navigation;
  onNavigate: (conceptId: number) => void;
  onSubmitAnswer: (exerciseId: number, answer: string) => Promise<{
    isCorrect: boolean;
    correctAnswer: string;
    solution: string;
  }>;
}

export default function ConceptLesson({
  concept,
  exercises,
  navigation,
  onNavigate,
  onSubmitAnswer,
}: ConceptLessonProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showHint1, setShowHint1] = useState(false);
  const [showHint2, setShowHint2] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    solution: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];

  const resetExerciseState = () => {
    setShowHint1(false);
    setShowHint2(false);
    setShowSolution(false);
    setAnswer("");
    setSelectedOption(null);
    setResult(null);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      resetExerciseState();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      resetExerciseState();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentExercise) return;

    setIsSubmitting(true);
    
    try {
      let submittedAnswer = "";
      
      if (currentExercise.type === "mcq" && selectedOption !== null) {
        submittedAnswer = currentExercise.options![selectedOption];
      } else if (currentExercise.type === "short_answer") {
        submittedAnswer = answer;
      }
      
      const response = await onSubmitAnswer(currentExercise.id, submittedAnswer);
      setResult(response);
      
      // Automatically show solution after answer
      setShowSolution(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Navigation bar */}
      <div className="flex justify-between items-center mb-6">
        {navigation.previous ? (
          <button
            onClick={() => onNavigate(navigation.previous!.id)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiChevronLeft className="mr-1" />
            Previous: {navigation.previous.title}
          </button>
        ) : (
          <div></div>
        )}
        
        {navigation.next ? (
          <button
            onClick={() => onNavigate(navigation.next!.id)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            Next: {navigation.next.title}
            <FiChevronRight className="ml-1" />
          </button>
        ) : (
          <div></div>
        )}
      </div>
      
      {/* Concept explanation */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{concept.title}</h2>
        {concept.pageSpan && (
          <p className="text-sm text-gray-500 mb-3">
            Pages: {concept.pageSpan}
          </p>
        )}
        <div className="prose max-w-none">
          <p className="text-gray-700">{concept.summary}</p>
        </div>
      </div>
      
      {/* Exercise section */}
      {currentExercise && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Practice Exercise
            </h3>
            <div className="text-sm text-gray-500">
              {currentExerciseIndex + 1} of {exercises.length}
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 font-medium mb-4">{currentExercise.question}</p>
            
            {currentExercise.type === "mcq" && currentExercise.options && (
              <div className="space-y-2">
                {currentExercise.options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => !result && setSelectedOption(index)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedOption === index
                        ? result
                          ? result.isCorrect
                            ? "bg-green-100 border border-green-300"
                            : index === currentExercise.options!.indexOf(result.correctAnswer)
                              ? "bg-green-100 border border-green-300"
                              : "bg-red-100 border border-red-300"
                          : "bg-blue-100 border border-blue-300"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    } ${result ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div>{option}</div>
                      {result && selectedOption === index && (
                        <div className="ml-auto">
                          {result.isCorrect ? (
                            <FiCheck className="text-green-600 text-xl" />
                          ) : (
                            <FiX className="text-red-600 text-xl" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {currentExercise.type === "short_answer" && (
              <div>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!!result}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {result && (
                  <div className={`mt-2 p-2 rounded-md ${
                    result.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {result.isCorrect ? (
                      <div className="flex items-center">
                        <FiCheck className="mr-2" />
                        <span>Correct!</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FiX className="mr-2" />
                        <span>The correct answer is: {result.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Hints and Solution */}
          <div className="space-y-4 mb-6">
            {!showHint1 && !result && (
              <button
                onClick={() => setShowHint1(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FiHelpCircle className="mr-1" />
                Show First Hint
              </button>
            )}
            
            {showHint1 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-1">Hint 1:</p>
                <p className="text-yellow-800">{currentExercise.hint1}</p>
              </div>
            )}
            
            {showHint1 && !showHint2 && !result && (
              <button
                onClick={() => setShowHint2(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FiHelpCircle className="mr-1" />
                Show Second Hint
              </button>
            )}
            
            {showHint2 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-1">Hint 2:</p>
                <p className="text-yellow-800">{currentExercise.hint2}</p>
              </div>
            )}
            
            {showSolution && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-1">Solution:</p>
                <div className="text-green-800">{currentExercise.solution}</div>
                
                {currentExercise.memoryHook && (
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <p className="text-sm font-medium text-green-800 mb-1">Memory Hook:</p>
                    <p className="text-green-800 italic">{currentExercise.memoryHook}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                className={`px-3 py-2 rounded-md ${
                  currentExerciseIndex === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
                className={`px-3 py-2 rounded-md ${
                  currentExerciseIndex === exercises.length - 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Next
              </button>
            </div>
            
            {!result && (
              <button
                onClick={handleSubmitAnswer}
                disabled={
                  isSubmitting ||
                  (currentExercise.type === "mcq" && selectedOption === null) ||
                  (currentExercise.type === "short_answer" && !answer.trim())
                }
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  isSubmitting ||
                  (currentExercise.type === "mcq" && selectedOption === null) ||
                  (currentExercise.type === "short_answer" && !answer.trim())
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Checking..." : "Submit Answer"}
              </button>
            )}
            
            {!showSolution && result && (
              <button
                onClick={() => setShowSolution(true)}
                className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Show Solution
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 