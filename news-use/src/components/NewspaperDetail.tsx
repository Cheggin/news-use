import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface Article {
  link: string;
  content: string;
  headline?: string;
}

interface NewspaperDetailProps {
  newspaperId: Id<"created_newspapers">;
  onClose: () => void;
}

export function NewspaperDetail({ newspaperId, onClose }: NewspaperDetailProps) {
  const newspaper = useQuery(api.newspapers.getNewspaper, { id: newspaperId });
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["comprehensive"]));

  if (!newspaper) {
    return null;
  }

  const toggleArticle = (articleKey: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleKey)) {
        newSet.delete(articleKey);
      } else {
        newSet.add(articleKey);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  // Parse and format the summary content
  const parseSummary = (content: string) => {
    // Add double line breaks between paragraphs and sections
    const formatted = content
      // Clean up literal \n\n and extra backslashes
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n')
      // Remove standalone backslashes with whitespace around them
      .replace(/\s*\\\s*/g, ' ')
      // First, normalize any existing line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      // Add breaks before numbered sections
      .replace(/([.!?])\s*(\d+\.)/g, '$1\n\n$2')
      // Add breaks before subheadings with colons (e.g., "The Acceleration of AI:")
      .replace(/([.!?])\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:)/g, '$1\n\n$2')
      // Add breaks after closing parentheses before capital titles
      .replace(/\)\s*([A-Z][a-z]+\s+[A-Z])/g, ')\n\n$1')
      // Add breaks between "Article X" references
      .replace(/([.!?])\s*(Article\s+\d+)/g, '$1\n\n$2')
      // Main logic: Add paragraph breaks after sentences
      // Match: period/question/exclamation + space(s) + Capital letter word (but not common connectors)
      .replace(/([.!?])\s+([A-Z](?:[a-z]+|I)\s)/g, (match, punctuation, nextWord) => {
        const word = nextWord.trim();
        // Keep common sentence starters together
        const connectors = ['The', 'This', 'That', 'These', 'Those', 'A', 'An', 'In', 'On', 'At',
                          'From', 'For', 'And', 'But', 'Or', 'As', 'It', 'Its', "It's", 'If',
                          'When', 'While', 'To', 'By'];
        if (connectors.includes(word)) {
          return match;
        }
        return punctuation + '\n\n' + nextWord;
      });

    // Split into sections
    const sections: { title: string; content: string; key: string }[] = [];

    // Try to identify major sections with more flexible patterns
    // Look for ## headings or numbered sections
    const headerPattern = /(?:^|\n)(?:##\s*(.+?)|(\d+)\.\s*(.+?))\n/g;
    const matches = [...formatted.matchAll(headerPattern)];

    if (matches.length > 0) {
      // Check for content before the first header - this might be the summary
      if (matches[0].index! > 0) {
        const preContent = formatted.slice(0, matches[0].index!).trim();
        if (preContent.length > 50) { // Only add if it's substantial content
          sections.push({
            title: "Comprehensive Summary",
            content: preContent,
            key: "comprehensive"
          });
        }
      }

      // Parse sections based on headers found
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const title = match[1] || match[3]; // Either ## heading or numbered title
        const startIdx = match.index! + match[0].length;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index! : formatted.length;
        const content = formatted.slice(startIdx, endIdx).trim();

        // Determine section key based on title content
        let key = "other";
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes("summary") || lowerTitle.includes("comprehensive")) {
          key = "comprehensive";
        } else if (lowerTitle.includes("context") || lowerTitle.includes("background")) {
          key = "context";
        } else if (lowerTitle.includes("mean") || lowerTitle.includes("matter") || lowerTitle.includes("why")) {
          key = "meaning";
        } else if (lowerTitle.includes("related") || lowerTitle.includes("bigger") || lowerTitle.includes("picture")) {
          key = "related";
        }

        sections.push({
          title: title.trim(),
          content: content,
          key: key
        });
      }
    }

    // If no sections found, return the whole content as one section
    if (sections.length === 0) {
      sections.push({
        title: "Analysis",
        content: formatted,
        key: "comprehensive"
      });
    }

    return sections;
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const allArticles = Object.entries(newspaper.newspapers || {}) as [string, Article][];

  // Separate summary from source articles
  const summaryEntry = allArticles.find(([key]) => key.includes("summary"));
  const sourceArticles = allArticles.filter(([key]) => !key.includes("summary"));

  // Helper function to recursively process children and highlight article references
  const processChildren = (children: any): any => {
    if (typeof children === 'string') {
      const articlePattern = /\(Article \d+\)|Article \d+|Articles? \d+(?:\s*&\s*\d+)?/g;
      if (articlePattern.test(children)) {
        const parts = children.split(/(\(Article \d+\)|Article \d+|Articles? \d+(?:\s*&\s*\d+)?)/g);
        return parts.map((part, i) => {
          if (/\(Article \d+\)|Article \d+|Articles? \d+(?:\s*&\s*\d+)?/.test(part)) {
            return (
              <span key={i} className="text-orange-500 font-semibold">
                {part}
              </span>
            );
          }
          return part;
        });
      }
      return children;
    }

    if (Array.isArray(children)) {
      return children.map((child) => processChildren(child));
    }

    // Handle React elements (like <strong>, <em>, etc.)
    if (children && typeof children === 'object' && children.props) {
      return children;
    }

    return children;
  };

  // Custom markdown components to highlight article references
  const markdownComponents: Components = {
    p: ({ children }) => {
      return <p>{processChildren(children)}</p>;
    },
    li: ({ children }) => {
      return <li>{processChildren(children)}</li>;
    },
    strong: ({ children }) => {
      return <strong>{processChildren(children)}</strong>;
    },
    em: ({ children }) => {
      return <em>{processChildren(children)}</em>;
    },
    h3: ({ children }) => {
      return <h3>{processChildren(children)}</h3>;
    },
    h4: ({ children }) => {
      return <h4>{processChildren(children)}</h4>;
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-7xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl
                    overflow-hidden flex flex-col animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{newspaper.query}</h2>
              <p className="text-sm text-zinc-400">
                {newspaper.articleCount} articles • Created {new Date(newspaper.createdAt).toLocaleDateString()}
                {newspaper.userName && <span> • by {newspaper.userName}</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Column - AI Summary */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto">
            <div className="p-6">
              {summaryEntry ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full font-medium">
                      AI Summary
                    </span>
                  </div>

                  {/* Collapsible Sections */}
                  <div className="space-y-3">
                    {parseSummary(summaryEntry[1].content).map((section) => {
                      const isExpanded = expandedSections.has(section.key);
                      return (
                        <div key={section.key} className="border border-zinc-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection(section.key)}
                            className="w-full flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                          >
                            <h3 className="text-base font-semibold text-white">
                              {section.title}
                            </h3>
                            <svg
                              className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="p-4 bg-zinc-900/50">
                              <div className="prose prose-invert max-w-none prose-sm
                                            prose-headings:text-white prose-headings:font-bold
                                            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
                                            prose-h4:text-sm prose-h4:mt-5 prose-h4:mb-2
                                            prose-p:text-zinc-300 prose-p:my-3 prose-p:leading-7
                                            prose-ul:text-zinc-300 prose-ul:my-3 prose-ul:space-y-2
                                            prose-ol:text-zinc-300 prose-ol:my-3 prose-ol:space-y-2
                                            prose-li:text-zinc-300 prose-li:leading-7 prose-li:my-1
                                            prose-strong:text-white prose-strong:font-semibold
                                            prose-em:text-zinc-200
                                            prose-blockquote:my-3 prose-blockquote:border-l-orange-500
                                            prose-a:text-orange-500 prose-a:no-underline hover:prose-a:text-orange-400
                                            [&>*]:mb-3 [&>*:last-child]:mb-0">
                                <ReactMarkdown components={markdownComponents}>{section.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-zinc-400 text-sm">No summary available</p>
              )}
            </div>
          </div>

          {/* Right Column - Source Articles */}
          <div className="w-full lg:w-1/2 overflow-y-auto bg-zinc-900/50">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="px-3 py-1 text-xs bg-zinc-700 text-zinc-300 rounded-full font-medium">
                  {sourceArticles.length} Source Articles
                </span>
              </div>
              <div className="space-y-4">
                {sourceArticles.map(([key, article]) => {
                  const isExpanded = expandedArticles.has(key);
                  const content = article.content || "";
                  const preview = content.substring(0, 200);
                  const hasMore = content.length > 200;
                  const headline = article.headline || content.split(".")[0] || "Article";

                  return (
                    <div key={key} className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                      <h4 className="text-base font-semibold text-white mb-2">
                        {headline}
                      </h4>

                      {article.link && (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-500 hover:text-orange-400 transition-colors inline-flex items-center space-x-1 mb-3"
                        >
                          <span className="truncate max-w-xs">Read original</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}

                      <div className="text-zinc-400 text-xs leading-relaxed">
                        {isExpanded ? content : preview}
                        {hasMore && !isExpanded && "..."}
                      </div>

                      {hasMore && (
                        <button
                          onClick={() => toggleArticle(key)}
                          className="mt-2 text-xs text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          {isExpanded ? "Show Less" : "Read More"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}