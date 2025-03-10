# AI Receptionist for Event Management - TECKZITE

## Setup Instructions

### 1. Install Dependencies
Ensure you have Python installed. Then, run the following command to install all required dependencies:
```bash
pip install -r requirements.txt
```

### 2. Prepare Rasa Data Files
Ensure you have the following files properly configured with necessary intents, responses, and actions:
- `nlu.yml` (Contains intents and example user messages)
- `stories.yml` (Defines conversation flows)
- `domain.yml` (Defines responses, intents, and actions)

### 3. Train the Rasa Model
Run the following command to train the Rasa model:
```bash
rasa train
```

### 4. Run Rasa Servers in Parallel
Start two servers in parallel:

#### Run Rasa Actions Server:
```bash
rasa run actions
```

#### Run Rasa Main Server:
```bash
rasa run --enable-api --cors "*"
```

### 5. Interacting with the Chatbot
Once both servers are running, the chatbot interacts with users through `agent chatbot.js`. The chatbot:
- Processes user queries and refines responses from the Rasa model.
- Enhances responses with **Gemini API integration**.
- Provides complete information about **TECKZITE**, the event it is designed for.
- Sends **email reminders** to registered students 10 minutes before their scheduled events.
- Shows event locations using **Leaflet API** for precise navigation within **Rajiv Gandhi University of Knowledge Technologies, Nuzvid**.

---

## Tech Stack
We have built this project using the **MERN stack**:

### **Backend:**
- **MongoDB**: Stores registered user details and event information.
- **Express.js**: Handles fetch requests and API endpoints.
- **Node.js**: Runs the REST API for chatbot interactions and database operations.

### **Frontend:**
- **React.js**: Provides an interactive UI for users.
- **Leaflet.js API**: Displays event locations on a map.

### **AI & Rasa Framework:**
- **Rasa NLU & Core**: Manages chatbot conversations.
- **Gemini API**: Enhances chatbot responses.
- **Email Integration**: Sends reminders to registered users.

---

## Features
- **Event Information**: Provides details about events at TECKZITE.
- **Personalized Reminders**: Sends emails 10 minutes before an event.
- **Location Navigation**: Guides users to event locations using Leaflet.
- **AI-Enhanced Chatbot**: Uses Gemini API for better responses.

# AI Receptionist for Event Management - TECKZITE
![Rasa Interactive Agent for Event Assistance](https://i.ibb.co/Tq1j5nWT/image.png)

This AI Receptionist serves as a smart assistant for managing event-related queries and providing seamless event navigation. 🚀

