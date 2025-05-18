import React from 'react';
import { Zap, User } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser, timestamp }) => {
  // Render markdown-style content with proper formatting
  const renderContent = (text: string) => {
    // Convert line breaks to JSX breaks and avoid adding any data-* attributes to Fragment
    const withLineBreaks = text.split('\n').map((line, i) => {
      const isLastLine = i === text.split('\n').length - 1;
      return (
        <React.Fragment key={i}>
          {line}
          {!isLastLine && <br />}
        </React.Fragment>
      );
    });
    
    return withLineBreaks;
  };

  // Detect and format lists in content
  const formatLists = (content: string) => {
    // Simple detection of lists (assuming proper markdown-like formatting)
    const hasOrderedList = /^\d+\.\s/.test(content);
    const hasUnorderedList = /^[\*\-]\s/.test(content);
    
    if (hasOrderedList || hasUnorderedList) {
      const items = content.split('\n').filter(item => item.trim());
      const listType = hasOrderedList ? 'ol' : 'ul';
      
      return (
        <div>
          {listType === 'ol' ? (
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              {items.map((item, i) => {
                // Remove list markers for ordered lists
                const cleanItem = item.replace(/^\d+\.\s/, '');
                return cleanItem ? <li key={i}>{cleanItem}</li> : null;
              })}
            </ol>
          ) : (
            <ul className="list-disc ml-5 mt-2 space-y-1">
              {items.map((item, i) => {
                // Remove list markers for unordered lists
                const cleanItem = item.replace(/^[\*\-]\s/, '');
                return cleanItem ? <li key={i}>{cleanItem}</li> : null;
              })}
            </ul>
          )}
        </div>
      );
    }

    return <p>{renderContent(content)}</p>;
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
            ? 'mr-3 bg-forest-50 rounded-lg p-3 shadow-sm' 
            : 'ml-3 bg-white rounded-lg p-3 shadow-sm flex-1'
        }`}
      >
        {formatLists(content)}
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
