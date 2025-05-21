import React, { ReactNode } from 'react';
import { Zap, User } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser, timestamp }) => {
  // Process content to properly format code blocks and text
  const processContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract the code content without the backticks
        const codeContent = part.slice(3, -3);
        return formatCodeBlock(codeContent);
      } else {
        // Process regular text (including lists, bold, etc.)
        return part ? formatText(part) : null;
      }
    });
  };

  // Format regular text (including line breaks, lists, bold)
  const formatText = (text: string) => {
    // Check for lists
    if (text.trim().match(/^(\d+\.\s|\*\s|\-\s).+/m)) {
      return formatLists(text);
    }
    
    // Convert line breaks and process normal text
    const lines = text.split('\n');
    return (
      <div className="whitespace-pre-wrap">
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {processBoldAndItalic(line)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Process bold and italic text
  const processBoldAndItalic = (text: string): ReactNode => {
    // Remove trailing asterisks or underscores
    let processedText = text.replace(/([*_]+)$/g, '');
    const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
    const boldParts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(processedText)) !== null) {
      const matchedText = match[1] || match[2];
      boldParts.push(processedText.substring(lastIndex, match.index));
      boldParts.push(<strong key={`bold-${match.index}`}>{matchedText}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < processedText.length) {
      boldParts.push(processedText.substring(lastIndex));
    }

    return boldParts.length > 0 ? boldParts : text;
  };

  // Format code blocks with proper styling
  const formatCodeBlock = (code: string) => {
    // Extract language from first line if it exists
    let language = '';
    let codeContent = code;
    
    // Check if first line contains language identifier
    const firstLineMatch = code.match(/^(python|javascript|typescript|jsx|tsx|java|c|cpp|csharp|html|css|sql|bash|shell|ruby|php|swift|go|rust|json|xml)\n/i);
    if (firstLineMatch) {
      language = firstLineMatch[1].toLowerCase();
      codeContent = code.substring(firstLineMatch[0].length);
    }
    
    return (
      <div className="my-3">
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto font-mono text-sm leading-relaxed">
          {language && (
            <div className="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-600 font-sans">
              {language}
            </div>
          )}
          <code>{codeContent}</code>
        </pre>
      </div>
    );
  };

  // Detect and format inline code
  const formatInlineCode = (content: string | ReactNode): ReactNode => {
    // If content is not a string (already a ReactNode), return it as is
    if (typeof content !== 'string') {
      return content;
    }
    
    // Match inline code (text between single backticks)
    const parts = content.split(/(`[^`]+`)/);
    
    if (parts.length === 1) {
      // No inline code found
      return content;
    }
    
    const formattedParts = parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        // This is inline code
        const code = part.slice(1, -1);
        return (
          <code 
            key={index} 
            className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded font-mono text-sm"
          >
            {code}
          </code>
        );
      }
      return part;
    });
    
    return formattedParts;
  };

  // Detect and format lists
  const formatLists = (content: string) => {
    const lines = content.split('\n');
    const formattedContent = [];
    
    let currentList = null;
    let currentItems = [];
    let currentListType = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const orderedMatch = line.match(/^(\d+)\.\s(.+)/);
      const unorderedMatch = line.match(/^(\*|\-)\s(.+)/);
      
      if (orderedMatch) {
        if (currentListType !== 'ol') {
          // End previous list if it exists
          if (currentList) {
            formattedContent.push(currentList);
            currentItems = [];
          }
          currentListType = 'ol';
        }
        currentItems.push(orderedMatch[2]);
      } else if (unorderedMatch) {
        if (currentListType !== 'ul') {
          // End previous list if it exists
          if (currentList) {
            formattedContent.push(currentList);
            currentItems = [];
          }
          currentListType = 'ul';
        }
        currentItems.push(unorderedMatch[2]);
      } else {
        // End current list if it exists
        if (currentListType) {
          currentList = currentListType === 'ol' 
            ? <ol className="list-decimal ml-5 mt-2 mb-2 space-y-1">{currentItems.map((item, idx) => <li key={idx}>{formatInlineCode(item)}</li>)}</ol>
            : <ul className="list-disc ml-5 mt-2 mb-2 space-y-1">{currentItems.map((item, idx) => <li key={idx}>{formatInlineCode(item)}</li>)}</ul>;
          
          formattedContent.push(currentList);
          currentItems = [];
          currentListType = null;
        }
        
        // Add non-list content
        if (line.trim()) {
          formattedContent.push(
            <p key={`p-${i}`} className="mb-2">
              {formatInlineCode(processBoldAndItalic(line))}
            </p>
          );
        } else if (i > 0 && lines[i-1].trim()) {
          // Add space between paragraphs
          formattedContent.push(<div key={`space-${i}`} className="h-2" />);
        }
      }
    }
    
    // Add any remaining list
    if (currentListType) {
      currentList = currentListType === 'ol' 
        ? <ol className="list-decimal ml-5 mt-2 mb-2 space-y-1">{currentItems.map((item, idx) => <li key={idx}>{formatInlineCode(item)}</li>)}</ol>
        : <ul className="list-disc ml-5 mt-2 mb-2 space-y-1">{currentItems.map((item, idx) => <li key={idx}>{formatInlineCode(item)}</li>)}</ul>;
      
      formattedContent.push(currentList);
    }
    
    return <div>{formattedContent}</div>;
  };

  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 rounded-full bg-lime-100 p-2">
          <Zap className="h-6 w-6 text-lime-600" />
        </div>
      )}
      
      <div 
        className={`${
          isUser 
            ? 'mr-3 bg-forest-50 rounded-lg p-3 shadow-sm max-w-[80%]' 
            : 'ml-3 bg-white rounded-lg p-3 shadow-sm max-w-[80%] flex-1'
        }`}
      >
        <div className="message-content">
          {processContent(content)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {timestamp}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 rounded-full bg-forest-100 p-2">
          <User className="h-6 w-6 text-forest-600" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
