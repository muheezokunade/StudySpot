import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { FiUpload, FiBook, FiClock, FiFileText, FiCheck } from "react-icons/fi";
import FileUpload from "../components/FileUpload";
import ConceptLesson from "../components/ConceptLesson";

// API service functions
async function uploadDocument(file: File, title: string): Promise<{ documentId: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  
  const response = await fetch("/api/tutor/upload", {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Failed to upload document");
  }
  
  return response.json();
}

async function fetchDocuments(): Promise<any[]> {
  const response = await fetch("/api/tutor/documents");
  
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  
  return response.json();
}

async function fetchDocument(documentId: number): Promise<any> {
  const response = await fetch(`/api/tutor/documents/${documentId}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }
  
  return response.json();
}

async function fetchConcept(conceptId: number): Promise<any> {
  const response = await fetch(`/api/tutor/concepts/${conceptId}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch concept");
  }
  
  return response.json();
}

async function submitAnswer(exerciseId: number, answer: string): Promise<any> {
  const response = await fetch(`/api/tutor/exercises/${exerciseId}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to submit answer");
  }
  
  return response.json();
}

async function fetchConceptsForReview(): Promise<any[]> {
  const response = await fetch("/api/tutor/review");
  
  if (!response.ok) {
    throw new Error("Failed to fetch concepts for review");
  }
  
  return response.json();
}

// Main component
export default function AITutor() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const mode = params.mode || "documents";
  const id = params.id ? parseInt(params.id) : undefined;
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentConcept, setCurrentConcept] = useState<any>(null);
  const [reviewConcepts, setReviewConcepts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user documents when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (error) {
        setError("Failed to load documents");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocuments();
  }, []);
  
  // Load data based on current mode and ID
  useEffect(() => {
    const loadData = async () => {
      setError(null);
      
      if (mode === "document" && id) {
        try {
          setIsLoading(true);
          const data = await fetchDocument(id);
          setCurrentDocument(data);
        } catch (error) {
          setError("Failed to load document");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      } else if (mode === "concept" && id) {
        try {
          setIsLoading(true);
          const data = await fetchConcept(id);
          setCurrentConcept(data);
        } catch (error) {
          setError("Failed to load concept");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      } else if (mode === "review") {
        try {
          setIsLoading(true);
          const concepts = await fetchConceptsForReview();
          setReviewConcepts(concepts);
        } catch (error) {
          setError("Failed to load review concepts");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [mode, id]);
  
  // Handle file upload
  const handleUpload = async (file: File, title: string) => {
    try {
      const { documentId } = await uploadDocument(file, title);
      
      // Refresh documents list
      const docs = await fetchDocuments();
      setDocuments(docs);
      
      // Navigate to the document page
      setLocation(`/tutor/document/${documentId}`);
    } catch (error) {
      setError("Failed to upload document");
      console.error(error);
      throw error;
    }
  };
  
  // Handle concept navigation
  const handleConceptNavigation = (conceptId: number) => {
    setLocation(`/tutor/concept/${conceptId}`);
  };
  
  // Handle answer submission
  const handleSubmitAnswer = async (exerciseId: number, answer: string) => {
    try {
      return await submitAnswer(exerciseId, answer);
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    }
  };
  
  // Render upload view
  const renderUploadView = () => (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Learning Material</h1>
      <FileUpload onUpload={handleUpload} />
    </div>
  );
  
  // Render documents list
  const renderDocumentsList = () => (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Learning Materials</h1>
        <Link href="/tutor/upload">
          <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
            <FiUpload className="mr-2" />
            Upload New
          </a>
        </Link>
      </div>
      
      {documents.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">You haven't uploaded any learning materials yet.</p>
          <Link href="/tutor/upload">
            <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center">
              <FiUpload className="mr-2" />
              Upload Your First Document
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/tutor/document/${doc.id}`}>
              <a className="bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FiFileText className="text-blue-500 text-xl" />
                  </div>
                  <div className="ml-3">
                    <h2 className="font-semibold text-gray-800">{doc.title}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === "indexed" 
                          ? "bg-green-100 text-green-800" 
                          : doc.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {doc.status === "indexed" 
                          ? "Ready to study" 
                          : doc.status === "processing"
                            ? "Processing"
                            : "Failed"}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render document view with concepts
  const renderDocumentView = () => {
    if (!currentDocument) return null;
    
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <Link href="/tutor/documents">
            <a className="text-blue-600 hover:text-blue-800">← Back to Documents</a>
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{currentDocument.document.title}</h1>
          <p className="text-sm text-gray-500">
            Uploaded on {new Date(currentDocument.document.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Concepts to Learn</h2>
        
        {currentDocument.concepts.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-600">No concepts have been extracted yet. Please check back later.</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg divide-y">
            {currentDocument.concepts.map((concept, index) => (
              <Link key={concept.id} href={`/tutor/concept/${concept.id}`}>
                <a className="block p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{concept.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{concept.summary}</p>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render concept lesson view
  const renderConceptView = () => {
    if (!currentConcept) return null;
    
    return (
      <div>
        <div className="max-w-3xl mx-auto p-4 mb-2">
          <Link href={`/tutor/document/${currentConcept.concept.documentId}`}>
            <a className="text-blue-600 hover:text-blue-800">← Back to Document</a>
          </Link>
        </div>
        
        <ConceptLesson
          concept={currentConcept.concept}
          exercises={currentConcept.exercises}
          navigation={currentConcept.navigation}
          onNavigate={handleConceptNavigation}
          onSubmitAnswer={handleSubmitAnswer}
        />
      </div>
    );
  };
  
  // Render review view
  const renderReviewView = () => (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/tutor/documents">
          <a className="text-blue-600 hover:text-blue-800">← Back to Documents</a>
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        <FiClock className="inline mr-2" />
        Concepts Due for Review
      </h1>
      
      {reviewConcepts.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600">No concepts are due for review right now.</p>
          <p className="text-gray-600 mt-2">Great job staying on top of your studies!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg divide-y">
          {reviewConcepts.map((concept) => (
            <Link key={concept.id} href={`/tutor/concept/${concept.id}`}>
              <a className="block p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <FiBook className="text-yellow-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{concept.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{concept.summary}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render tab navigation
  const renderTabs = () => (
    <div className="bg-white border-b shadow-sm mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex space-x-4">
          <Link href="/tutor/documents">
            <a className={`py-4 px-2 border-b-2 ${
              mode === "documents" || mode === "document" 
                ? "border-blue-500 text-blue-600 font-medium" 
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}>
              <FiFileText className="inline mr-1" />
              Documents
            </a>
          </Link>
          <Link href="/tutor/review">
            <a className={`py-4 px-2 border-b-2 ${
              mode === "review" 
                ? "border-blue-500 text-blue-600 font-medium" 
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}>
              <FiClock className="inline mr-1" />
              Review
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
  
  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show tabs except in concept view */}
      {mode !== "concept" && renderTabs()}
      
      {/* Display loading state */}
      {isLoading && (
        <div className="max-w-4xl mx-auto p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
      
      {/* Display error message */}
      {error && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        </div>
      )}
      
      {/* Show content based on current mode */}
      {!isLoading && !error && (
        <>
          {mode === "upload" && renderUploadView()}
          {mode === "documents" && renderDocumentsList()}
          {mode === "document" && renderDocumentView()}
          {mode === "concept" && renderConceptView()}
          {mode === "review" && renderReviewView()}
        </>
      )}
    </div>
  );
} 