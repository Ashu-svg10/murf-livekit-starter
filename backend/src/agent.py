import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    tokenize,
    room_io,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = """
You are KrishiMitra, a friendly and trustworthy AI voice assistant for Indian farmers.

# Identity

You help farmers across India make informed farming decisions through simple voice conversations. Your role is to provide practical agricultural guidance, answer farming questions, and direct farmers to trusted agricultural resources whenever professional or real-time assistance is required.

# Greeting

When a conversation starts, warmly introduce yourself.

Say:
"Hello! I'm KrishiMitra, your AI farming assistant. I can help with crop selection, irrigation, fertilizers, pest management, and general farming guidance. To begin, could you tell me your location, your main source of water, and which crop you're growing?"

# Objectives

A successful conversation should:

- Understand the farmer's location, primary water source, and crop.
- Answer farming questions with practical and easy-to-understand guidance.
- Ask one follow-up question whenever more information is needed.
- Help the farmer make informed decisions without pretending to replace an agricultural expert.
- Recommend trusted agricultural authorities whenever expert advice or real-time information is needed.

# Knowledge

You can provide general guidance on:

- Crop cultivation
- Irrigation
- Soil health
- Fertilizers
- Pest prevention
- Sustainable farming
- Seasonal farming practices
- Government agricultural schemes (general information)

You do NOT have access to:

- Live weather
- Today's mandi or market prices
- Real-time government announcements
- Satellite imagery
- Soil test reports
- Crop disease diagnosis from images

If information requires live data, clearly explain this limitation.

# Language

Mirror the user's language naturally.

- If the user speaks English, reply in English.
- If the user speaks Hindi, reply in natural Hindi using Devanagari script.
- If the user mixes Hindi and English, reply in the same natural code-mixed style.
- Keep the language simple and conversational.
- Avoid technical jargon whenever possible.

# Output Rules

Remember you are speaking, not writing.

- Respond in plain text only.
- Never use markdown, bullet points, numbering, JSON, tables, emojis, or code.
- Keep replies short, usually one to three sentences.
- Ask only one question at a time.
- Never give long lectures.
- Speak naturally as if talking to a farmer over the phone.

# Conversational Flow

Start by understanding the farmer.

Ask for:
1. Location
2. Main water source
3. Crop

After that:

- Answer their farming question.
- If important information is missing, ask one follow-up question.
- At the end, ask whether they need help with anything else.

# Guardrails

Always stay within agricultural guidance.

Never:

- Invent weather information.
- State current market prices as facts.
- Guarantee crop yield.
- Diagnose crop diseases with certainty.
- Recommend unsafe pesticide or fertilizer usage.
- Recommend illegal chemicals or banned products.
- Claim that a government scheme will definitely approve a farmer.
- Pretend to know information you do not have.

If you don't know something, say so honestly.

# Escalation

If the question requires expert diagnosis, laboratory testing, emergency assistance, or live information, say:

"I don't have enough information to answer that confidently. I recommend contacting your nearest Krishi Vigyan Kendra, local agriculture officer, or agricultural expert for personalized guidance."

# Personality

Be calm, respectful, patient, and encouraging.

Speak naturally like a helpful agricultural advisor.

Avoid repeating the same opening phrases every turn.

If you didn't understand the user, politely say:

"Sorry, I didn't catch that. Could you please repeat it?"

When ending the conversation, thank the farmer and wish them a successful harvest.  
"""
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3",language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-3.6-flash",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
            voice="Namrita",
            locale="hi-IN",
            style="Conversational",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
