import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaMoon, FaStore, FaClipboardList, FaLaptopCode, FaLightbulb, FaTrophy, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./glitter.css";
import MapComponent from './MapComponent';

const GEMINI_API_KEY = "AIzaSyAMEQ_c9hqT2xC8E9vWZJIB62PebLHzS2s"; // Use REACT_APP_ prefix for Create React App

// Global chat history (stores last 10 messages per user)
const chatHistory = new Map(); // Stores user_id -> chat messages

const Chatbot = () => {
  const [messages, setMessages] = useState([{ text: "Hello! How can I assist you?", sender: "bot" }]);
  const [userInput, setUserInput] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  // Predefined quick action buttons
  const predefinedMessages = {
    Events: "What events are available for everyone?",
    Theme: "What themes are covered in the AI Hackathon?",
    Sponsors: "Can you list the sponsors for Teckzite?",
    registrations: "What is the registration process for Teckzite?",
    workshops: "What workshops are being conducted?",
    hackathons: "What hackathons are available at Teckzite?",
    MegaExpo: "Tell me about the MegaExpo event.",
  };

  // Fetch user details from MongoDB after login
  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    const teckziteId = localStorage.getItem("teckzite_id");
    if (!teckziteId) return;

    try {
      const response = await fetch("https://react-rasa-3.onrender.com/get-user-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teckzite_id: teckziteId }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const generateTechZiteResponse = async (userQuery, additionalContext, userDetails) => {
    if (!GEMINI_API_KEY) return "⚠️ API key missing.";
  
    // ✅ Always fetch the latest teckzite_id from localStorage
    const teckziteId = localStorage.getItem("teckzite_id") || null;
  
    // ✅ Ensure user-specific chat history exists
    if (!teckziteId) {
      return "❌ Sorry, you are not logged in. Please log in to continue.";
    }
  
    if (!chatHistory.has(teckziteId)) {
      chatHistory.set(teckziteId, []);
    }
  
    let previousChats = chatHistory.get(teckziteId) || [];
  
    // ✅ Store only the last 10 messages
    if (previousChats.length > 10) {
      previousChats = previousChats.slice(-10);
    }
    chatHistory.set(teckziteId, previousChats);
  
    // ✅ Format chat history (both user queries & bot responses)
    const formattedChatHistory = previousChats.length > 0
      ? previousChats.map(chat => `User: ${chat.user}\nBot: ${chat.bot}`).join("\n")
      : "No previous conversation.";
  
    console.log("🔹 Chat History Sent to Gemini:", formattedChatHistory);
  
    // ✅ Ensure `userDetails` is available
    const userInfo = userDetails
      ? `Name: ${userDetails.name}, Email: ${userDetails.email}, Registered Events: ${userDetails.events?.join(", ") || "None"}`
      : "User details not available.";
  
    // ✅ Detect greeting queries (without overriding other responses)
    const lowerQuery = userQuery.toLowerCase();
    const isGreeting = ["hi", "hello", "hey"].some(greet => lowerQuery === greet);
  
    if (isGreeting) {
      // ✅ If the user greets and no prior greeting exists in history, return it
      const lastUserMessage = previousChats.length > 0 ? previousChats[previousChats.length - 1].user.toLowerCase() : "";
      if (lastUserMessage !== lowerQuery) {
        const greetingResponse = `Hi ${teckziteId}, I am here to assist you!`;
        previousChats.push({ user: userQuery, bot: greetingResponse });
        chatHistory.set(teckziteId, previousChats.slice(-10));
        return greetingResponse;
      }
    }
  
    // ✅ Check if the same query was asked before, return historical response
    const previousResponse = previousChats.find(chat => chat.user.toLowerCase() === lowerQuery);
    if (previousResponse) {
      return previousResponse.bot;
    }
  
    // ✅ Construct the final prompt for Gemini API
    const finalPrompt = `
  You are TechZiteBot, the official event assistant for TechZite 2025. 
  Your role is to provide **accurate, dynamic, and user-specific responses** based on:
  - **Previous conversations**
  - **User details (Teckzite ID, name, registered events, etc.)**
  - **Rasa’s structured knowledge base**
  
  🆔 **User Details:**
  ${userDetails?.teckzite_id 
    ? `Teckzite ID: ${userDetails.teckzite_id}, Name: ${userDetails.name}, Email: ${userDetails.email}, Registered Events: ${userDetails.events?.join(", ") || "None"}`
    : "User details not available."}
  
  💬 **Previous Conversation History:**
  ${formattedChatHistory}
  
  ❓ **New User Query:**
  User: ${userQuery}
  
  🎯 **Rasa’s Response to This Query:**
  ${additionalContext}
  
  🚀 **Instructions:**
  - **Generate a context-aware response** based on prior messages.
  - **Use Rasa’s response as a guide**, but refine it dynamically.
  - **Do NOT include unnecessary greetings** (only greet if explicitly asked).
  - **Avoid repeating previous answers exactly** unless the same question was asked.
  - **If the query relates to events, reference the user's registered events.**
  
  💡 **Now, generate the next response naturally and contextually!**
  `;
  
    console.log("🔹 Final Prompt Sent to Gemini:\n", finalPrompt);
  
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
          }),
        }
      );
  
      const data = await response.json();
      console.log("🔹 Gemini API Response:", data);
  
      const geminiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "🤖 No meaningful response.";
  
      // ✅ Remove markdown bold and italics from response
      let formattedResponse = geminiResponse.replace(/(\*\*|\*)/g, "");
  
      // ✅ Store new response in chat history (corrected trim order)
      previousChats.push({ user: userQuery, bot: formattedResponse });
      chatHistory.set(teckziteId, previousChats.slice(-10));
  
      return formattedResponse;
    } catch (error) {
      console.error("⚠️ Gemini API Error:", error);
      return `⚠️ Error: ${error.message}`;
    }
  };
  
  

  // Send message to Rasa and process Gemini AI response
  const sendMessage = async (message) => {
    const userMessage = message || userInput;
    if (!userMessage.trim()) return;

    const newMessages = [...messages, { text: userMessage, sender: "user" }];
    setMessages(newMessages);
    setIsTyping(true);
    setUserInput("");

    if (/thank|thanks|great|awesome|nice bot|good job|appreciate/i.test(userMessage)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }

    try {
      const rasaResponse = await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", message: userMessage }),
      });

      const rasaData = await rasaResponse.json();
      const rasaText = rasaData.length > 0 ? rasaData[0].text : "I don't have an answer for that.";

      const formatResponseForHTML = (response) => {
        if (!response) return "🤖 No meaningful response.";
        let formattedText = response.replace(/(\*\*|\*)/g, "");
        return formattedText;
      };

      const finalResponse = await generateTechZiteResponse(userMessage, rasaText);
      const formattedResponse = formatResponseForHTML(finalResponse);

      setMessages([...newMessages, { text: formattedResponse, sender: "bot" }]);
    } catch (error) {
      setMessages([...newMessages, { text: "⚠️ Server not responding.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.header}>RasaTeckAgent</h1>

      <div style={styles.container}>
        {showConfetti && <div className="confetti"></div>}

        <div style={styles.buttonContainer}>
          {Object.entries(predefinedMessages).map(([key, value]) => (
            <button key={key} style={styles.quickButton} onClick={() => sendMessage(value)}>
              {key === "Events" && <FaCalendarAlt />}
              {key === "Theme" && <FaMoon />}
              {key === "Sponsors" && <FaStore />}
              {key === "registrations" && <FaClipboardList />}
              {key === "workshops" && <FaLightbulb />}
              {key === "hackathons" && <FaLaptopCode />}
              {key === "MegaExpo" && <FaTrophy />}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}

          {/* New "Show Event Map" Button */}
          <button style={styles.quickButton} onClick={() => navigate('/map')}>
            <FaMapMarkerAlt /> Show Event Map
          </button>
        </div>

        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div key={index} style={{ ...styles.message, ...(msg.sender === "user" ? styles.userMessage : styles.botMessage) }}>
              {msg.text}
            </div>
          ))}
          {isTyping && <div style={styles.botMessage}>🤖 Typing...</div>}
        </div>

        <div style={styles.inputContainer}>
          <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Type a message..." style={styles.input} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
          <button onClick={() => sendMessage()} style={styles.button}>Send</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    padding: "10px",
    position: "relative",
    background: "none", // Removed background color
  },
  header: {
    fontSize: "48px", // Increased font size for more prominence
    fontWeight: "bold",
    marginBottom: "30px", // Increased margin to give more space below the header
    padding: "1px", // Increased padding for better balance
    backgroundColor: "white",
    WebkitBackgroundClip: "text",
    color: "transparent",
    textShadow: "0px 0px 30px rgb(235, 231, 240), 0px 0px 40px rgba(255, 105, 180, 0.8)", // More intense text shadow with an additional color
    letterSpacing: "2px", // Slight letter spacing to make the text more stylish and prominent
    textAlign: "center", // Center the text
    // Optional: making the text uppercase for a bolder feel
  },
  container: {
    width: "70vw", // Adjusted to 70% of the viewport width
    maxWidth: "1000px", // Optional: You can set a max-width to prevent it from becoming too wide on large screens
    height: "80vh",
    padding: "20px",
    borderRadius: "15px",
    backgroundColor: "#1a1a1a",  // Lightened dark color to match with purple and white
    boxShadow: "0 0 15px rgba(20, 75, 138, 0.1)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  buttonContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "15px",
  },
  quickButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#6a11cb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "0.3s",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    border: "1px solid #555",
    padding: "15px",
    borderRadius: "10px",
    backgroundColor: "#2a2a2a",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    padding: "10px",
    borderRadius: "12px",
    margin: "5px",
    maxWidth: "70%", // Restrict message width
    wordWrap: "break-word",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2575fc",
    color: "white",
    textAlign: "right",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#444",
    textAlign: "left",
  },
  inputContainer: {
    display: "flex",
    marginTop: "15px",
  },
  input: {
    flex: 1,
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#333",
    color: "#fff",
    fontSize: "16px",
  },
  button: {
    padding: "12px 20px",
    backgroundColor: "#6a11cb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    marginLeft: "8px",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Chatbot;
