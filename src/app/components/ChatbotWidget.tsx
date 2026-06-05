"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface SummaryScores {
  activity: number;
  affection_needed: number;
  maintenance_willingness: number;
  noise_tolerance: number;
  time_away: number;
}

interface Message {
  id: string;
  sender: "cat" | "user";
  text?: string;
  timestamp: Date;
  type?: "text" | "summary";
  summaryScores?: SummaryScores;
}

export default function ChatbotWidget() {
  const loadingStatusRef = useRef<HTMLDivElement | null>(null);
  const recommendationsRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const scrollStorageKey = "pawmatch-chatbot-scroll-top";
  const hasRestoredScrollRef = useRef(false);
  const previousContentLengthRef = useRef(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "cat",
      text: "Hi there! I'm PawMatch, your AI adoption assistant. How can I help you find your perfect cat companion today?",
      timestamp: new Date(),
    },
  ]);

  type RecommendationStatus = "idle" | "loading" | "success" | "failed";

  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>("idle");

  const [loadingPhase, setLoadingPhase] = useState<1 | 2 | 3>(1);

  const [statusMessage, setStatusMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);

  const recommendedBreeds = [
    {
      name: "Ragdoll",
      vibe: "Gentle and affectionate",
      score: "9.4",
    },
    {
      name: "British Shorthair",
      vibe: "Calm and low-maintenance",
      score: "9.1",
    },
    {
      name: "Maine Coon",
      vibe: "Playful and social",
      score: "8.8",
    },
    {
      name: "Scottish Fold",
      vibe: "Quiet and adaptable",
      score: "8.6",
    },
    {
      name: "Siberian",
      vibe: "Balanced and family-friendly",
      score: "8.5",
    },
  ];

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");

    // Simulate a cat response after a short delay
    setTimeout(() => {
      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "cat",
        type: "summary",
        timestamp: new Date(),
        summaryScores: {
          activity: 8,
          affection_needed: 9,
          maintenance_willingness: 6,
          noise_tolerance: 4,
          time_away: 7,
        },
      };

      setMessages((prev) => [...prev, summaryMessage]);
    }, 500);
  };

  const handleConfirm = async () => {
    setShowRecommendations(false);
    setRecommendationStatus("loading");
    setLoadingPhase(1);
    setStatusMessage("Analyzing your compatibility profile...");

    try {
      setTimeout(() => {
        setLoadingPhase(2);
        setStatusMessage("Matching you with ideal cat personalities...");
      }, 2000);

      setTimeout(() => {
        setLoadingPhase(3);
        setStatusMessage("Generating your personalized recommendations...");
      }, 4000);

      await new Promise((resolve) => setTimeout(resolve, 6000));

      setRecommendationStatus("success");
      setStatusMessage("Perfect matches found! Your cat recommendations are ready.");
    } catch (error) {
      setRecommendationStatus("failed");
      setStatusMessage("Oops! Something went wrong while generating recommendations.");
    }
  };

  const handleRetry = () => {
    handleConfirm();
  };

  const handleShowRecommendations = () => {
    setMessages([]);
    setShowRecommendations(true);
    setRecommendationStatus("idle");
    setStatusMessage("");

    requestAnimationFrame(() => {
      recommendationsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const recommendationQuestion =
    "Do you have any questions regarding your recommendations? Like why certain breeds were ranked higher or how to prepare for adopting one of these cats?";

  const askFollowUpQuestions = () => {
    const followUpQuestions: Message[] = [
      {
        id: `${Date.now()}-q1`,
        sender: "cat",
        text: "Refining your score now. Do you prefer a more active cat or a more relaxed one?",
        timestamp: new Date(),
      },
      {
        id: `${Date.now()}-q2`,
        sender: "cat",
        text: "How much time do you usually spend at home during the day?",
        timestamp: new Date(),
      },
    ];

    setMessages((prev) => [...prev, ...followUpQuestions]);
    setShowRecommendations(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (recommendationStatus !== "idle") {
      loadingStatusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [recommendationStatus]);

  useEffect(() => {
    const savedScrollTop = sessionStorage.getItem(scrollStorageKey);

    if (savedScrollTop !== null && messagesRef.current) {
      messagesRef.current.scrollTop = Number(savedScrollTop);
    }

    hasRestoredScrollRef.current = true;
    previousContentLengthRef.current = messages.length;
  }, []);

  useEffect(() => {
    if (!hasRestoredScrollRef.current || !messagesRef.current) return;

    const contentLength = messages.length + (showRecommendations ? 1 : 0) + (recommendationStatus !== "idle" ? 1 : 0);

    if (contentLength === previousContentLengthRef.current) return;

    previousContentLengthRef.current = contentLength;

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [messages, showRecommendations, recommendationStatus]);

  const handleMessagesScroll = () => {
    if (!messagesRef.current) return;

    sessionStorage.setItem(
      scrollStorageKey,
      messagesRef.current.scrollTop.toString(),
    );
  };

  

  return (
    <div className="chatbot-widget">
      <div className="widget-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        {showRecommendations && (
          <div className="recommendations-slot" ref={recommendationsRef}>
            <div className="recommendations-panel">
              <div className="recommendations-header">
                <h3>Your Best Matches</h3>
                <p>Five highly compatible breeds, arranged to fit the chat area.</p>
              </div>

              <div className="breed-scroll-list">
                {recommendedBreeds.map((breed) => (
                  <div key={breed.name} className="breed-card">
                    <span className="breed-score">{breed.score}</span>
                    <h4>{breed.name}</h4>
                    <p>{breed.vibe}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showRecommendations && (
          <div className="message-wrapper message-cat recommendation-question">
            <Image
              src="/favicon.ico"
              alt="Bot"
              width={30}
              height={30}
              className="profile-pic"
            />
            <div className="message cat">
              <p>{recommendationQuestion}</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper message-${message.sender}`}
          >
            {message.sender === "cat" && (
              <Image
                src="/favicon.ico"
                alt="Cat"
                width={30}
                height={30}
                className="profile-pic"
              />
            )}
            <div className={`message ${message.sender}`}>
              {message.type === "summary" && message.summaryScores ? (
                <div className="summary-card">
                  <h3>Your Cat Match Profile <br/>
                  <span style={{
                    fontSize: "0.9rem",
                    color: "#555",
                    marginBottom: "1rem",
                    fontFamily: "'DM Mono'",
                    fontWeight: "500",
                  }}>These scores aren’t meant to judge you; they help personalize your cat matches.</span>
</h3>
                  {Object.entries(message.summaryScores).map(([key, value]) => (
                    <div key={key} className="score-row">
                      <div className="score-label">
                        {key.replaceAll("_", " ")}
                      </div>

                      <div className="score-bar-wrapper">
                        <div
                          className="score-bar"
                          style={{ width: `${value * 10}%` }}
                        />
                      </div>

                      <div className="score-value">{value}/10</div>
                    </div>
                  ))}

                  <div className="summary-actions">
                    <button
                      className="confirm-btn"
                      onClick={handleConfirm}
                      disabled={recommendationStatus === "loading"}
                    >
                      Confirm
                    </button>

                    <button className="back-btn" onClick={askFollowUpQuestions}>
                      Refine Scores
                    </button>
                  </div>
                </div>
              ) : (
                <>
                <p>{message.text}</p>
                </>
              )}
            </div>
          </div>
        ))}

        {recommendationStatus !== "idle" && (
          <div className="chat-status-slot" ref={loadingStatusRef}>
            <div className={`summary-status ${recommendationStatus}`}>
              <div className="summary-status-avatar">
                <Image
                  src={
                    recommendationStatus === "loading"
                      ? loadingPhase === 1
                        ? "/weights.png"
                        : loadingPhase === 2
                          ? "/reading.png"
                          : "/binary-code.png"
                      : recommendationStatus === "success"
                        ? "/party.png"
                        : "/file.png"
                  }
                  alt="Status"
                  width={42}
                  height={42}
                  sizes="(max-width: 480px) 72px, (max-width: 768px) 84px, 96px"
                  className="loading-status"
                />
              </div>

              <span className="summary-status-title">
                {recommendationStatus === "loading"
                  ? "PawMatch Assistant"
                  : recommendationStatus === "success"
                    ? "Recommendations Ready"
                    : "Recommendation Failed"}
              </span>

              <p>{statusMessage}</p>

              {recommendationStatus === "loading" && (
                <div className="typing-loader">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}

              {recommendationStatus === "success" && (
                <button
                  className="status-action-btn"
                  onClick={handleShowRecommendations}
                >
                  Show Recommendations
                </button>
              )}

              {recommendationStatus === "failed" && (
                <button className="status-action-btn" onClick={handleRetry}>
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="widget-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="widget-message-input"
        />
        <button onClick={handleSendMessage} className="widget-send-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
