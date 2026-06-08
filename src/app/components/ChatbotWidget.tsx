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

  type Trait = {
    value: number;
    confidence: number;
  };

  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>("idle");

  const [loadingPhase, setLoadingPhase] = useState<1 | 2 | 3>(1);

  const [statusMessage, setStatusMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);

  const [summary, setSummary] = useState("No summary yet");
  const [change, setChange] = useState("No changes yet");
  const [traits, setTraits] = useState<Record<string, Trait>>({
    activity: { value: -1, confidence: 0 },
    affection_need: { value: -1, confidence: 0 },
    maintenance_willingness: { value: -1, confidence: 0 },
    noise_tolerance: { value: -1, confidence: 0 },
    time_away: { value: -1, confidence: 0 },
  });
  const [isSending, setIsSending] = useState(false);

  const [recommendedBreeds, setRecommendedBreeds] = useState<any[]>([]);
  const [selectedCatForPopup, setSelectedCatForPopup] = useState<any | null>(null);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isSending) return;

    const userMessageText = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setIsSending(true);

    const lastCatMessage = [...messages].reverse().find((m) => m.sender === "cat" && m.text);
    const lastQuestion = lastCatMessage ? lastCatMessage.text : "";

    try {
      const requestBody = {
        isConfirm: false,
        message: userMessageText,
        summary: summary,
        change: change,
        traits: traits,
        last_question: lastQuestion,
      };

      const res = await fetch("https://n8n-production-6bc1.up.railway.app/webhook/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error("Failed to send message to webhook");
      }

      const responseData = await res.json();
      const data = Array.isArray(responseData) ? responseData[0] : responseData;

      if (data) {
        if (data.chat_history !== undefined && data.chat_history !== null) {
          setSummary(data.chat_history);
        } else if (data.summary !== undefined && data.summary !== null) {
          setSummary(data.summary);
        }

        if (data.change !== undefined && data.change !== null) {
          setChange(data.change);
        }
        
        let newTraits = { ...traits };
        if (data.traits) {
          newTraits = {
            ...newTraits,
            ...data.traits,
          };
          setTraits(newTraits);
        }

        const botReply = data.llm_response || data.message;
        if (botReply) {
          const botMessage: Message = {
            id: Date.now().toString(),
            sender: "cat",
            text: botReply,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }

        // Show the match profile summary card when source is confirmation_route
        if (data.source === "confirmation_route") {
          const summaryMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: "cat",
            type: "summary",
            timestamp: new Date(),
            summaryScores: {
              activity: newTraits.activity.value ?? -1,
              affection_needed: newTraits.affection_need.value ?? -1,
              maintenance_willingness: newTraits.maintenance_willingness.value ?? -1,
              noise_tolerance: newTraits.noise_tolerance.value ?? -1,
              time_away: newTraits.time_away.value ?? -1,
            },
          };
          setMessages((prev) => [...prev, summaryMessage]);
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: "cat",
        text: "Oops, I encountered an issue connecting to my brain. Please try sending your message again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = async () => {
    setShowRecommendations(false);
    setRecommendationStatus("loading");
    setLoadingPhase(1);
    setStatusMessage("Analyzing your compatibility profile...");

    try {
      const userAnswers: Record<string, number> = {};
      Object.entries(traits).forEach(([key, trait]) => {
        userAnswers[key] = trait.value;
      });

      const requestBody = {
        isConfirm: true,
        message: "",
        summary: summary,
        change: change,
        traits: userAnswers,
        user_answers: userAnswers,
      };

      const fetchPromise = fetch("https://n8n-production-6bc1.up.railway.app/webhook/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const phase2Timeout = setTimeout(() => {
        setLoadingPhase(2);
        setStatusMessage("Matching you with ideal cat personalities...");
      }, 1500);

      const phase3Timeout = setTimeout(() => {
        setLoadingPhase(3);
        setStatusMessage("Generating your personalized recommendations...");
      }, 3000);

      const res = await fetchPromise;
      clearTimeout(phase2Timeout);
      clearTimeout(phase3Timeout);

      if (!res.ok) {
        throw new Error("Failed to confirm profile with webhook");
      }

      const responseData = await res.json();
      let list: any[] = [];
      let reasoningList: string[] = [];
      if (responseData) {
        let firstElem = responseData;
        if (Array.isArray(responseData)) {
          firstElem = responseData[0];
        }
        
        if (firstElem) {
          let resultsSource = firstElem.results;
          if (typeof resultsSource === "string") {
            try {
              resultsSource = JSON.parse(resultsSource);
            } catch (err) {
              console.error("Failed to parse results string:", err);
            }
          }

          if (Array.isArray(resultsSource)) {
            list = resultsSource;
          } else if (Array.isArray(firstElem.breeds)) {
            list = firstElem.breeds;
          } else if (Array.isArray(firstElem.recommendations)) {
            list = firstElem.recommendations;
          } else if (Array.isArray(firstElem.recommendedBreeds)) {
            list = firstElem.recommendedBreeds;
          } else if (Array.isArray(responseData)) {
            list = responseData;
          }

          if (typeof firstElem.reasoning === "string") {
            reasoningList = firstElem.reasoning.split(";").map((r: string) => r.trim()).filter((r: string) => r.length > 0);
          }
        }
      }

      const mappedList = list.map((cat: any, idx: number) => ({
        ...cat,
        reasoning: reasoningList[idx] || ""
      }));
      setRecommendedBreeds(mappedList);

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
    const followUpMessage: Message = {
      id: `${Date.now()}-refine`,
      sender: "cat",
      text: "Is there anything else you would like to add?",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, followUpMessage]);
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

    const contentLength = messages.length + (showRecommendations ? 1 : 0) + (recommendationStatus !== "idle" ? 1 : 0) + (isSending ? 1 : 0);

    if (contentLength === previousContentLengthRef.current) return;

    previousContentLengthRef.current = contentLength;

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [messages, showRecommendations, recommendationStatus, isSending]);

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
                {recommendedBreeds.map((cat, idx) => (
                  <div
                    key={cat.cat_id || idx}
                    className="breed-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCatForPopup(cat)}
                  >
                    <span className="breed-score">
                      {cat.similarity !== undefined ? `${cat.similarity.toFixed(0)}% Match` : "9.0 Match"}
                    </span>
                    <h4>{cat.cat_name || cat.name || "Unnamed"}</h4>
                    <p className="breed-name">{cat.cat_breed || cat.breed || "Unknown Breed"}</p>
                    {cat.reasoning && <p className="breed-reason">{cat.reasoning}</p>}
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

        {isSending && (
          <div className="message-wrapper message-cat">
            <Image
              src="/favicon.ico"
              alt="Cat"
              width={30}
              height={30}
              className="profile-pic"
            />
            <div className="message cat">
              <div className="typing-loader" style={{ marginTop: 0 }}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

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
      {selectedCatForPopup && (
        <div className="modal-overlay" onClick={() => setSelectedCatForPopup(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCatForPopup(null)}>
              &times;
            </button>
            <div className="summary-card">
              <h3>
                {selectedCatForPopup.cat_name || selectedCatForPopup.name || "Unnamed"} <br/>
                <span style={{
                  fontSize: "0.9rem",
                  color: "#555",
                  marginBottom: "1rem",
                  fontFamily: "'DM Mono'",
                  fontWeight: "500",
                  display: "block",
                  marginTop: "0.25rem"
                }}>
                  Breed: {selectedCatForPopup.cat_breed || selectedCatForPopup.breed || "Unknown Breed"} | Sex: {selectedCatForPopup.Cat_sex || selectedCatForPopup.sex || "Unknown"}
                </span>
              </h3>
              
              {[
                { label: "Neuroticism", value: selectedCatForPopup.neuroticism },
                { label: "Energy Level", value: selectedCatForPopup.energy_level },
                { label: "Affection", value: selectedCatForPopup.affection },
                { label: "Child Friendly", value: selectedCatForPopup.child_friendly },
                { label: "Pet Friendly", value: selectedCatForPopup.pet_friendly },
                { label: "Vocal (Noise)", value: selectedCatForPopup.vocal },
                { label: "Trainability", value: selectedCatForPopup.trainability },
                { label: "Grooming Needs", value: selectedCatForPopup.grooming },
                { label: "Independence", value: selectedCatForPopup.independence },
                { label: "Dominance", value: selectedCatForPopup.dominance },
              ].map((item) => (
                <div key={item.label} className="score-row">
                  <div className="score-label">{item.label}</div>
                  <div className="score-bar-wrapper">
                    <div
                      className="score-bar"
                      style={{ width: item.value !== undefined ? `${(item.value / 7) * 100}%` : "0%" }}
                    />
                  </div>
                  <div className="score-value">{item.value !== undefined ? `${item.value}/7` : "N/A"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
