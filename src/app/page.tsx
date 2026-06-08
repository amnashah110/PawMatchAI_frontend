import Image from "next/image";
import ChatbotWidget from "./components/ChatbotWidget";

export default function Home() {
  return (
    <div className="homepage">
      <Image
        src="/hug.png"
        alt="PawMatchAI"
        width={200}
        loading="eager"
        height={200}
        sizes="(max-width: 480px) 72px, (max-width: 768px) 96px, 200px"
        className="hug-image"
        style={{
          position: "fixed",
          opacity: 0.3,
          zIndex: "100",
          bottom: "0%",
          right: "2%",
        }}
      />

      <section className="intro">
        <div className="title">
          PawMatchAI
          <Image
            src="/favicon.ico"
            alt="PawMatchAI Logo"
            width={100}
            height={100}
            sizes="(max-width: 480px) 42px, (max-width: 768px) 56px, 100px"
            className="title-icon"
            style={{
              rotate: "20deg",
            }}
          />
        </div>

        <div className="oneliner">Agent-based pet reccommendation platform</div>
      </section>

      <section>
        <div className="section-title">Mission Statement</div>
        <div>
          <h2>
            Our mission is to transform the pet adoption experience through an
            agentic AI-driven recommendation system that intelligently
            understands user lifestyles, preferences, and needs to provide
            personalized, explainable, and trustworthy cat breed matches.
          </h2>
        </div>
      </section>

      <section className="features-section">
        <div className="section-title">Why choose PawMatchAI?</div>
        <div className="features">
          <div className="card">
            <Image
              src="/home-office.gif"
              alt="AI-Powered Pet Matching"
              width={100}
              height={100}
            />
            <h2
              style={{
                textAlign: "center",
              }}
            >
              AI-Powered Pet Matching
            </h2>
            <p>
              Get personalized cat breed recommendations based on your
              lifestyle, preferences, and living environment using our
              intelligent matching system.
            </p>
          </div>

          <div className="card">
            <Image
              src="/love.gif"
              alt="Conversational Adoption Assistant"
              width={100}
              height={100}
            />
            <h2
              style={{
                textAlign: "center",
              }}
            >
              Conversational Adoption Assistant
            </h2>
            <p>
              Interact with our smart chatbot that guides you through the
              adoption journey, answers questions, and helps refine your ideal
              pet choice.
            </p>
          </div>

          <div className="card">
            <Image
              src="/accept.gif"
              alt="Explainable Recommendations"
              width={100}
              height={100}
            />
            <h2
              style={{
                textAlign: "center",
              }}
            >
              Explainable Recommendations
            </h2>
            <p>
              Every recommendation comes with detailed reasoning, compatibility
              insights, and breed profiles so you can adopt with confidence.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">Give PawMatchAI a Try!</div>
        <div className="chatbox">
          <ChatbotWidget />
        </div>
      </section>
    </div>
  );
}
